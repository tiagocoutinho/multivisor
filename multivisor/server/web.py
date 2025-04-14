import hashlib
import functools

import gevent
from blinker import signal
from gevent.monkey import patch_all

patch_all(thread=False)

import os
import logging

from gevent import queue, sleep
from gevent.pywsgi import WSGIServer
from flask import Flask, render_template, Response, request, json, jsonify, session
from werkzeug.debug import DebuggedApplication
from werkzeug.serving import run_simple

from multivisor.signals import SIGNALS
from multivisor.util import sanitize_url
from multivisor.multivisor import Multivisor
from .util import is_login_valid, login_required


log = logging.getLogger("multivisor")

app = Flask(__name__, static_folder="./dist/static", template_folder="./dist")


@app.route("/api/admin/reload")
@login_required(app)
def reload():
    app.multivisor.reload()
    return "OK"


@app.route("/api/refresh")
@login_required(app)
def refresh():
    app.multivisor.refresh()
    return jsonify(app.multivisor.safe_config)


@app.route("/api/data")
@login_required(app)
def data():
    return jsonify(app.multivisor.safe_config)


@app.route("/api/config/file")
@login_required(app)
def config_file_content():
    content = app.multivisor.config_file_content
    return jsonify(dict(content=content))


@app.route("/api/supervisor/update", methods=["POST"])
@login_required(app)
def update_supervisor():
    names = (
        str.strip(supervisor) for supervisor in request.form["supervisor"].split(",")
    )
    app.multivisor.update_supervisors(*names)
    return "OK"


@app.route("/api/supervisor/restart", methods=["POST"])
@login_required(app)
def restart_supervisor():
    names = (
        str.strip(supervisor) for supervisor in request.form["supervisor"].split(",")
    )
    app.multivisor.restart_supervisors(*names)
    return "OK"


@app.route("/api/supervisor/reread", methods=["POST"])
@login_required(app)
def reread_supervisor():
    names = (
        str.strip(supervisor) for supervisor in request.form["supervisor"].split(",")
    )
    app.multivisor.reread_supervisors(*names)
    return "OK"


@app.route("/api/supervisor/shutdown", methods=["POST"])
@login_required(app)
def shutdown_supervisor():
    names = (
        str.strip(supervisor) for supervisor in request.form["supervisor"].split(",")
    )
    app.multivisor.shutdown_supervisors(*names)
    return "OK"


@app.route("/api/process/restart", methods=["POST"])
@login_required(app)
def restart_process():
    patterns = request.form["uid"].split(",")
    procs = app.multivisor.restart_processes(*patterns)
    return "OK"


@app.route("/api/process/stop", methods=["POST"])
@login_required(app)
def stop_process():
    patterns = request.form["uid"].split(",")
    app.multivisor.stop_processes(*patterns)
    return "OK"


@app.route("/api/process/list")
@login_required(app)
def list_processes():
    return jsonify(tuple(app.multivisor.processes.keys()))


@app.route("/api/process/info/<uid>")
@login_required(app)
def process_info(uid):
    process = app.multivisor.get_process(uid)
    process.refresh()
    return json.dumps(process)


@app.route("/api/supervisor/info/<uid>")
@login_required(app)
def supervisor_info(uid):
    supervisor = app.multivisor.get_supervisor(uid)
    supervisor.refresh()
    return json.dumps(supervisor)


@app.route("/api/process/log/<stream>/tail/<uid>")
@login_required(app)
def process_log_tail(stream, uid):
    sname, pname = uid.split(":", 1)
    supervisor = app.multivisor.get_supervisor(sname)
    server = supervisor.server
    if stream == "out":
        tail = server.tailProcessStdoutLog
    else:
        tail = server.tailProcessStderrLog

    def event_stream():
        i, offset, length = 0, 0, 2 ** 12
        while True:
            data = tail(pname, offset, length)
            log, offset, overflow = data
            # don't care about overflow in first log message
            if overflow and i:
                length = min(length * 2, 2 ** 14)
            else:
                data = json.dumps(dict(message=log, size=offset))
                yield "data: {}\n\n".format(data)
            sleep(1)
            i += 1

    return Response(event_stream(), mimetype="text/event-stream")


@app.route("/api/login", methods=["post"])
def login():
    if not app.multivisor.use_authentication:
        return "Authentication is not required"
    username = request.form.get("username")
    password = request.form.get("password")
    if is_login_valid(app, username, password):
        session["username"] = username
        return json.dumps({})
    else:
        response_data = {"errors": {"password": "Invalid username or password"}}
        return json.dumps(response_data), 400


@app.route("/api/auth", methods=["get"])
def auth():
    response_data = {
        "use_authentication": app.multivisor.use_authentication,
        "is_authenticated": "username" in session,
    }
    return json.dumps(response_data)


@app.route("/api/logout", methods=["post"])
def logout():
    session.clear()
    return json.dumps({})


@app.route("/api/stream")
@login_required(app)
def stream():
    def event_stream():
        client = queue.Queue()
        app.dispatcher.add_listener(client)
        for event in client:
            yield event
        app.dispatcher.remove_listener(client)

    return Response(event_stream(), mimetype="text/event-stream")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    return render_template("index.html")


class Dispatcher(object):
    def __init__(self):
        self.clients = []
        for signal_name in SIGNALS:
            signal(signal_name).connect(self.on_multivisor_event)

    def add_listener(self, client):
        self.clients.append(client)

    def remove_listener(self, client):
        self.clients.remove(client)

    def on_multivisor_event(self, signal, payload):
        data = json.dumps(dict(payload=payload, event=signal))
        event = "data: {0}\n\n".format(data)
        for client in self.clients:
            client.put(event)


def set_secret_key():
    """
    In order to use flask sessions, secret_key must be set,
    require "MULTIVISOR_SECRET_KEY" env variable only if
    login and password is set in multivisor config
    You can generate secret by invoking:
    python -c 'import os; import binascii; print(binascii.hexlify(os.urandom(32)))'
    """
    if app.multivisor.use_authentication:
        secret_key = os.environ.get("MULTIVISOR_SECRET_KEY")
        if not secret_key:
            raise Exception(
                '"MULTIVISOR_SECRET_KEY" environmental variable must be set '
                "when authentication is enabled"
            )
        app.secret_key = secret_key


@app.errorhandler(401)
def custom_401(error):
    response_data = {"message": "Authenthication is required to access this endpoint"}
    return Response(
        json.dumps(response_data), 401, {"content-type": "application/json"}
    )


def run_with_reloader_if_debug(func):
    @functools.wraps(func)
    def wrapper_login_required(*args, **kwargs):
        if not app.debug:
            return func(*args, **kwargs)
        return run_simple(func, *args, **kwargs, use_reloader=True)

    return wrapper_login_required


def get_parser(args):
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--bind", help="[host][:port] (default: *:22000)", default="*:22000"
    )
    parser.add_argument(
        "-c",
        help="configuration file",
        dest="config_file",
        default="/etc/multivisor.conf",
    )
    parser.add_argument(
        "--log-level",
        help="log level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARN", "ERROR"],
    )
    return parser


@run_with_reloader_if_debug
def main(args=None):
    parser = get_parser(args)
    options = parser.parse_args(args)

    log_level = getattr(logging, options.log_level.upper())
    log_fmt = "%(levelname)s %(asctime)-15s %(name)s: %(message)s"
    logging.basicConfig(level=log_level, format=log_fmt)

    if not os.path.exists(options.config_file):
        parser.exit(
            status=2, message="configuration file does not exist. Bailing out!\n"
        )

    bind = sanitize_url(options.bind, host="*", port=22000)["url"]

    app.dispatcher = Dispatcher()
    app.multivisor = Multivisor(options)

    if app.multivisor.use_authentication:
        secret_key = os.environ.get("MULTIVISOR_SECRET_KEY")
        if not secret_key:
            raise Exception(
                '"MULTIVISOR_SECRET_KEY" environmental variable must be set '
                "when authentication is enabled"
            )
        app.secret_key = secret_key

    application = DebuggedApplication(app, evalex=True) if app.debug else app
    
    #look for a HTTPS server key and certificate and use them if available
    httpsKeyFile = os.environ.get( "MULTIVISOR_HTTPS_SERVER_KEY", "" )
    httpsCertFile = os.environ.get( "MULTIVISOR_HTTPS_CERT_FILE", "" )
    if( httpsKeyFile != "" and httpsCertFile != "" ):
        http_server = WSGIServer(bind, application=application, keyfile=httpsKeyFile, certfile=httpsCertFile)
    else:
        http_server = WSGIServer(bind, application=application)   
        
    logging.info("Start accepting requests")
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        log.info("Ctrl-C pressed. Bailing out")


if __name__ == "__main__":
    main()
