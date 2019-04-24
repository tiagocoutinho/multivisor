#!/usr/bin/env python
import functools

from gevent.monkey import patch_all
from werkzeug.debug import DebuggedApplication
from werkzeug.serving import run_with_reloader

patch_all(thread=False)

import os
import logging

import louie
from gevent import queue, sleep
from gevent.pywsgi import WSGIServer
from flask import Flask, render_template, Response, request, json, jsonify

from ..util import sanitize_url
from ..multivisor import Multivisor


log = logging.getLogger('multivisor')

app = Flask(__name__,
            static_folder='./dist/static',
            template_folder='./dist')


@app.route("/api/admin/reload")
def reload():
    app.multivisor.reload()
    return 'OK'


@app.route("/api/refresh")
def refresh():
    app.multivisor.refresh()
    return jsonify(app.multivisor.config)


@app.route("/api/data")
def data():
    return jsonify(app.multivisor.config)


@app.route("/api/config/file")
def config_file_content():
    content = app.multivisor.config_file_content
    return jsonify(dict(content=content))


@app.route("/api/supervisor/update", methods=['POST'])
def update_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    app.multivisor.update_supervisors(*names)
    return 'OK'


@app.route("/api/supervisor/restart", methods=['POST'])
def restart_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    app.multivisor.restart_supervisors(*names)
    return 'OK'


@app.route("/api/supervisor/reread", methods=['POST'])
def reread_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    app.multivisor.reread_supervisors(*names)
    return 'OK'


@app.route("/api/supervisor/shutdown", methods=['POST'])
def shutdown_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    app.multivisor.shutdown_supervisors(*names)
    return 'OK'


@app.route("/api/process/restart", methods=['POST'])
def restart_process():
    patterns = request.form['uid'].split(',')
    procs = app.multivisor.restart_processes(*patterns)
    return 'OK'


@app.route("/api/process/stop", methods=['POST'])
def stop_process():
    patterns = request.form['uid'].split(',')
    app.multivisor.stop_processes(*patterns)
    return 'OK'


@app.route("/api/process/list")
def list_processes():
    return jsonify(tuple(app.multivisor.processes.keys()))


@app.route("/api/process/info/<uid>")
def process_info(uid):
    process = app.multivisor.get_process(uid)
    process.refresh()
    return json.dumps(process)


@app.route("/api/supervisor/info/<uid>")
def supervisor_info(uid):
    supervisor = app.multivisor.get_supervisor(uid)
    supervisor.refresh()
    return json.dumps(supervisor)


@app.route("/api/process/log/<stream>/tail/<uid>")
def process_log_tail(stream, uid):
    sname, pname = uid.split(':', 1)
    supervisor = app.multivisor.get_supervisor(sname)
    server = supervisor.server
    if stream == 'out':
        tail = server.tailProcessStdoutLog
    else:
        tail = server.tailProcessStderrLog
    def event_stream():
        i, offset, length = 0, 0, 2**12
        while True:
            data = tail(pname, offset, length)
            log, offset, overflow = data
            # don't care about overflow in first log message
            if overflow and i:
                length = min(length * 2, 2**14)
            else:
                data = json.dumps(dict(message=log, size=offset))
                yield 'data: {}\n\n'.format(data)
            sleep(1)
            i += 1
    return Response(event_stream(), mimetype="text/event-stream")


@app.route('/api/stream')
def stream():
    def event_stream():
        client = queue.Queue()
        app.dispatcher.add_listener(client)
        for event in client:
            yield event
        app.dispatcher.remove_listener(client)
    return Response(event_stream(),
                    mimetype="text/event-stream")


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return render_template("index.html")


class Dispatcher(object):

    def __init__(self):
        self.clients = []
        louie.connect(self.on_multivisor_event, sender='multivisor')

    def add_listener(self, client):
        self.clients.append(client)

    def remove_listener(self, client):
        clients.clients.remove(client)

    def on_multivisor_event(self, signal, payload):
        data = json.dumps(dict(payload=payload, event=signal))
        event = 'data: {0}\n\n'.format(data)
        for client in self.clients:
            client.put(event)


def run_with_reloader_if_debug(func):
    @functools.wraps(func)
    def wrapper_login_required(*args, **kwargs):
        if not app.debug:
            return func(*args, **kwargs)
        return run_with_reloader(func, *args, **kwargs)

    return wrapper_login_required


@run_with_reloader_if_debug
def main(args=None):
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--bind', help='[host][:port] (default: 0:22000)',
                        default='0:22000')
    parser.add_argument('-c', help='configuration file',
                        dest='config_file',
                        default='/etc/multivisor.conf')
    parser.add_argument('--log-level', help='log level', type=str,
                        default='INFO',
                        choices=['DEBUG', 'INFO', 'WARN', 'ERROR'])
    options = parser.parse_args(args)

    log_level = getattr(logging, options.log_level.upper())
    log_fmt = '%(levelname)s %(asctime)-15s %(name)s: %(message)s'
    logging.basicConfig(level=log_level, format=log_fmt)

    if not os.path.exists(options.config_file):
        parser.exit(status=2, message='configuration file does not exist. Bailing out!\n')

    bind = sanitize_url(options.bind, host='0', port=22000)['url']

    app.dispatcher = Dispatcher()
    app.multivisor = Multivisor(options)
    application = DebuggedApplication(app, evalex=True) if app.debug else app
    http_server = WSGIServer(bind, application=application)
    logging.info('Start accepting requests')
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        log.info('Ctrl-C pressed. Bailing out')


if __name__ == "__main__":
    main()
