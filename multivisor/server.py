#!/usr/bin/env python

import gevent
from gevent.monkey import patch_all
patch_all(thread=False)

import os
import json
import logging
import weakref
import functools
from collections import OrderedDict
from ConfigParser import SafeConfigParser
from xmlrpclib import ServerProxy

from zmq import green as zmq
from louie import send, connect
from flask import Flask, render_template, Response, request, json
from gevent import queue, spawn, sleep, joinall
from supervisor.states import RUNNING_STATES
from supervisor.xmlrpc import Faults

log = logging.getLogger('multivisor')


def _to_host_port(url, default_port=None):
    pars = url.rsplit(':', 1) if isinstance(url, (str, unicode)) else url
    host, port = pars[0], int(pars[1]) if len(pars) > 1 else default_port
    try:
        host = host[host.index('://')+3:]
    except ValueError:
        pass
    return host, port


EVENT_CHANNEL = zmq.Context.instance().socket(zmq.SUB)
EVENT_CHANNEL.setsockopt(zmq.SUBSCRIBE, '')


class Supervisor(dict):

    # dict<identification, Supervisor>
    All = weakref.WeakValueDictionary()

    Null = {
        'identification': None,
        'api_version': None,
        'version': None,
        'supervisor_version': None,
        'processes': {},
        'running': False,
    }

    def __init__(self, *args, **kwargs):
        super(Supervisor, self).__init__(*args, **kwargs)
        self.name  = self['name']
        self.log = log.getChild(self.name)
        self.username = self.pop('username')
        self.password = self.pop('password')
        credentials = ''
        if self.username and self.password:
            credentials = '{0}:{1}@'.format(self.username, self.password)
        host, port = _to_host_port(self['url'], default_port=9001)
        self.address = 'http://{0}{1}:{2}/RPC2'.format(credentials, host, port)
        # fill supervisor info before events start coming in
        self.refresh()
        event_url = self.pop('event_url', None)
        if event_url:
            if '://' not in event_url:
                event_url = 'tcp://' + event_url
            EVENT_CHANNEL.connect(event_url)
        self.event_url = event_url

    @property
    def server(self):
        return ServerProxy(self.address)

    def handle_event(self, event):
        name = event['eventname']
        if name.startswith('SUPERVISOR_STATE'):
            self.refresh()
        elif not self['running']:
            self.refresh()
        elif name.startswith('PROCESS'):
            payload = event['payload']
            puid = '{}:{}@{}'.format(payload['groupname'],
                                     payload['processname'],
                                     self.name)
            self['processes'][puid].handle_event(event)

    def refresh(self):
        server = self.server
        try:
            pid = server.supervisor.getPID()
        except:
            pid = None
        return self._refresh(pid, server)

    def _refresh(self, pid, server=None):
        self.log.debug('updating')
        supervisor_name = self['name']
        server = self.server if server is None else server
        supervisor = self.server.supervisor
        if pid != self.get('pid'):
            self['pid'] = pid
            if pid is None: # server shutdown
                self.update(self.Null)
            else:
                self['running'] = True
                self['identification'] = ident = supervisor.getIdentification()
                self['api_version'] = supervisor.getAPIVersion()
                self['supervisor_version'] = supervisor.getSupervisorVersion()
                self.All[ident] = self
            modified = True
            self.log.info('supervisor %r state changed to %s', supervisor_name,
                          'RUNNING' if self['running'] else 'STOPPED')
        else:
            modified = False
        processes = {}
        old_processes = self.pop('processes', {})
        if pid is not None:
            for proc in supervisor.getAllProcessInfo():
                process = Process(self, proc)
                processes[process['uid']] = process
        self['processes'] = processes
        modified |= processes.keys() != old_processes.keys()
        if modified:
            send('multivisor', self, event='supervisor_changed')
            return True
        for name, process in processes.items():
            if process != old_processes[name]:
                modified = True
                send('multivisor', process, event='process_changed')
        return modified

    def update_server(self, group_names=()):
        supervisor = self.server.supervisor
        try:
            added, changed, removed = supervisor.reloadConfig()[0]
        except xmlrpclib.Fault as e:
            if e.faultCode == Faults.SHUTDOWN_STATE:
                self.log.debug('%s already shutting down', self.name)
                return
            else:
                self.log.error('Error reading config of %s', self.name)
                return

        # If any gnames are specified we need to verify that they are
        # valid in order to print a useful error message.
        if group_names:
            groups = set()
            for info in supervisor.getAllProcessInfo():
                groups.add(info['group'])
            # New gnames would not currently exist in this set so
            # add those as well.
            groups.update(added)

            for gname in group_names:
                if gname not in groups:
                    self.log.debug('unknown group %s', gname)

        for gname in removed:
            if group_names and gname not in group_names:
                continue
            results = supervisor.stopProcessGroup(gname)
            self.log.debug('stopped process group %s', gname)

            fails = [res for res in results
                     if res['status'] == Faults.FAILED]
            if fails:
                self.log.debug("%s as problems; not removing", gname)
                continue
            supervisor.removeProcessGroup(gname)
            self.log.debug("removed process group %s", gname)

        for gname in changed:
            if group_names and gname not in group_names:
                continue
            supervisor.stopProcessGroup(gname)
            self.log.debug('stopped process group %s', gname)

            supervisor.removeProcessGroup(gname)
            supervisor.addProcessGroup(gname)
            self.log.debug('updated process group %s', gname)

        for gname in added:
            if group_names and gname not in group_names:
                continue
            supervisor.addProcessGroup(gname)
            self.log.debug('added process group %s', gname)

        self.log.info('Updated %s', self.name)

    def restart(self):
        result = self.server.supervisor.restart()
        if result:
            self.log.info('Restarted %s', self.name)
        else:
            self.log.error('Error restarting %s', self.name)

    def reread(self):
        added, changed, removed = self.server.supervisor.reloadConfig()[0]
        self.log.info('Reread config of %s ' \
                      '(%d added; %d changed; %d disappeared)', self.name,
                      len(added), len(changed), len(removed))

    def shutdown(self):
        result = self.server.supervisor.shutdown()
        if result:
            self.log.info('Shut down %s', self.name)
        else:
            self.log.error('Error shutting down %s', self.name)


class Process(dict):

    def __init__(self, supervisor, *args, **kwargs):
        super(Process, self).__init__(*args, **kwargs)
        supervisor_name = supervisor['name']
        full_name = self['group'] + ':' + self['name']
        uid = full_name + '@' + supervisor_name
        self.log = log.getChild(uid)
        self.supervisor = weakref.proxy(supervisor)
        self['full_name'] = full_name
        self['running'] = self['state'] in RUNNING_STATES
        self['supervisor'] = supervisor_name
        self['host'] = supervisor['host']
        self['uid'] = full_name + '@' + self['supervisor']

    @property
    def server(self):
        return self.supervisor.server.supervisor

    @property
    def full_name(self):
        return self['full_name']

    def handle_event(self, event):
        event_name = event['eventname']
        if event_name.startswith('PROCESS_STATE'):
            self.refresh()

    def _refresh(self, server):
        info = server.getProcessInfo(self.full_name)
        old_self = self.copy()
        self.update(info)
        self['running'] = self['state'] in RUNNING_STATES
        modified = old_self != self
        if modified:
            send('multivisor', self, event='process_changed')
            if old_self['state'] != self['state']:
                self.log.info('%s changed from %s to %s', self,
                              old_self['statename'], self['statename'])

    def refresh(self):
        try:
            return self._refresh(self.server)
        except Exception as err:
            self.log.warn('Failed to refresh {}: {}'.format(self['uid'], err))

    def _start(self, server):
        try:
            server.startProcess(self.full_name)
        except:
            self.log.error('Error trying to start %s!', self)

    def start(self):
        return self._start(self.server)

    def _stop(self, server):
        try:
            server.stopProcess(self.full_name)
        except Exception as err:
            self.log.warn('Failed to stop {}: {}'.format(self['uid'], err))

    def stop(self):
        return self._stop(self.server)

    def restart(self):
        server = self.server
        if self['running']:
            self._stop(server)
        self._start(server)

    def __str__(self):
        return '{0} on {1}'.format(self['name'], self['supervisor'])

    def __eq__(self, proc):
        p1, p2 = dict(self), dict(proc)
        p1.pop('description')
        p1.pop('now')
        p2.pop('description')
        p2.pop('now')
        return p1 == p2

    def __ne__(self, proc):
        return not self == proc

# Configuration

def load_config(config_file):
    parser = SafeConfigParser()
    parser.read(config_file)
    dft_global = dict(name='multivisor')
    dft_supervisor = dict(event_port=None,
                          username=None,
                          password=None,
                          port=9001,
                          tags=())

    supervisors = {}
    config = dict(dft_global, supervisors=supervisors)
    config.update(parser.items('global'))
    for section in parser.sections():
        if not section.startswith('supervisor:'):
            continue
        name = section[len('supervisor:'):]
        kwargs = dict(dft_supervisor, name=name, host=name)
        kwargs.update(dict(parser.items(section)))
        supervisor = Supervisor(kwargs)
        supervisors[name] = supervisor
    return config


class Dispatcher(object):
    def __init__(self, multivisor):
        self.clients = []
        connect(self.dispatch, signal='multivisor')

    def dispatch(self, signal, sender, event):
        data = json.dumps(dict(payload=sender, event=event))
        event = 'data: {0}\n\n'.format(data)
        for client in self.clients:
            client.put(event)


class SSEHandler(logging.Handler):

    def emit(self, record):
        msg = dict(message=record.getMessage(),
                   level=record.levelname,
                   time=record.created,
                   name=record.name)
        send('multivisor', msg, event='notification')


class Multivisor(object):

    def __init__(self, options):
        self.options = options
        self._config = None
        self._dispatcher = Dispatcher(self)
        handler = SSEHandler(level=logging.INFO)
        log.addHandler(handler)

    @property
    def config(self):
        if self._config is None:
            self._config = load_config(self.options.config_file)
        return self._config

    def reload_config(self):
        self._config = None
        return self.config

    @property
    def supervisors(self):
        return self.config['supervisors']

    def poll_supervisors(self):
        tasks = [spawn(supervisor.refresh)
                 for supervisor in self.supervisors.values()
                 if supervisor.event_url is None]
        joinall(tasks)

    def get_supervisor(self, name):
        return self.supervisors[name]

    def get_process(self, uid):
        _, supervisor = uid.split('@', 1)
        return self.supervisors[supervisor]['processes'][uid]

    def add_listener(self, client):
        self._dispatcher.clients.append(client)

    def remove_listener(self, client):
        self._dispatcher.clients.remove(client)

    def run_forever(self):
        self._event_loop = spawn(event_loop)
        while True:
            self.poll_supervisors()
            sleep(self.options.poll_period)


def event_generator():
    while True:
        event_bytes = EVENT_CHANNEL.recv()
        yield json.loads(event_bytes)


def event_loop():
    while True:
        for event in event_generator():
            identification = event['server']
            supervisor = Supervisor.All[identification]
            supervisor.handle_event(event)


app = Flask(__name__,
            static_folder='./dist/static',
            template_folder='./dist')


@app.route("/")
def index():
#    return app.send_static_file('index.html')
    return render_template('index.html')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return render_template("index.html")


@app.route("/admin/reload")
def reload_config():
    app.multivisor.reload_config()
    return 'OK'


@app.route("/refresh")
def refresh():
    app.multivisor.poll_supervisors()
    return json.dumps(app.multivisor.config)


@app.route("/data")
def data():
    return json.dumps(app.multivisor.config)


@app.route("/supervisor/update", methods=['POST'])
def update_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    supervisors = (app.multivisor.get_supervisor(name) for name in names)
    tasks = [spawn(supervisor.update_server) for supervisor in supervisors]
    joinall(tasks)
    return 'OK'


@app.route("/supervisor/restart", methods=['POST'])
def restart_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    supervisors = (app.multivisor.get_supervisor(name) for name in names)
    tasks = [spawn(supervisor.restart) for supervisor in supervisors]
    joinall(tasks)
    return 'OK'


@app.route("/supervisor/reread", methods=['POST'])
def reread_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    supervisors = (app.multivisor.get_supervisor(name) for name in names)
    tasks = [spawn(supervisor.reread) for supervisor in supervisors]
    joinall(tasks)
    return 'OK'


@app.route("/supervisor/shutdown", methods=['POST'])
def shutdown_supervisor():
    names = (unicode.strip(supervisor)
             for supervisor in request.form['supervisor'].split(','))
    supervisors = (app.multivisor.get_supervisor(name) for name in names)
    tasks = [spawn(supervisor.shutdown) for supervisor in supervisors]
    joinall(tasks)
    return 'OK'


@app.route("/process/restart", methods=['POST'])
def restart_process():
    uids = (unicode.strip(uid) for uid in request.form['uid'].split(','))
    processes = (app.multivisor.get_process(uid) for uid in uids)
    tasks = [spawn(process.restart) for process in processes]
    joinall(tasks)
    return 'OK'


@app.route("/process/stop", methods=['POST'])
def stop_process():
    uids = (unicode.strip(uid) for uid in request.form['uid'].split(','))
    processes = (app.multivisor.get_process(uid) for uid in uids)
    tasks = [spawn(process.stop) for process in processes]
    joinall(tasks)
    return 'OK'


@app.route("/process/info/<uid>")
def process_info(uid):
    process = app.multivisor.get_process(uid)
    process.refresh()
    return json.dumps(process)


@app.route("/supervisor/info/<uid>")
def supervisor_info(uid):
    supervisor = app.multivisor.get_supervisor(uid)
    supervisor.refresh()
    return json.dumps(supervisor)


@app.route("/process/log/<stream>/tail/<uid>")
def process_log_tail(stream, uid):
    pname, sname = uid.split('@', 1)
    supervisor = app.multivisor.get_supervisor(sname)
    server = supervisor.server.supervisor
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


@app.route('/stream')
def stream():
    def event_stream():
        client = queue.Queue()
        app.multivisor.add_listener(client)
        for event in client:
            yield event
        app.multivisor.remove_listener(client)
    return Response(event_stream(),
                    mimetype="text/event-stream")


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
    parser.add_argument('--poll-period', help='polling period(s)', type=float,
                        default=2)
    options = parser.parse_args(args)

    log_level = getattr(logging, options.log_level.upper())
    log_fmt = '%(levelname)s %(asctime)-15s %(name)s: %(message)s'
    logging.basicConfig(level=log_level, format=log_fmt)

    if not os.path.exists(options.config_file):
        parser.exit(status=2, message='configuration file does not exist. Bailing out!\n')

    bind = _to_host_port(options.bind, 22000)

    app.multivisor = Multivisor(options)

    app_task = spawn(app.multivisor.run_forever)

    from gevent.wsgi import WSGIServer

    http_server = WSGIServer(bind, application=app)
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        log.info('Ctrl-C pressed. Bailing out')


if __name__ == "__main__":
    main()
