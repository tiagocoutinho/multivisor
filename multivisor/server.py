#!/usr/bin/env python

import gevent
from gevent.monkey import patch_all
patch_all(thread=False)

import os
import re
import time
import logging
import weakref
from ConfigParser import SafeConfigParser

import zerorpc
from gevent import queue, spawn, sleep, joinall
from flask import Flask, render_template, Response, request, json
from supervisor.xmlrpc import Faults
from supervisor.states import RUNNING_STATES

log = logging.getLogger('multivisor')


def sanitize_url(url, protocol=None, host=None, port=None):
    match = re.match('((?P<protocol>\w+)\://)?(?P<host>\w+)?(\:(?P<port>\d+))?', url)
    if match is None:
        raise ValueError('Invalid URL: {!r}'.format(url))
    pars = match.groupdict()
    _protocol, _host, _port = pars['protocol'], pars['host'], pars['port']
    protocol = protocol if _protocol is None else _protocol
    host = host if _host is None else _host
    port = port if _port is None else _port
    protocol = '' if protocol is None else (protocol + '://')
    port = '' if port is None else ':' + str(port)
    return dict(url='{}{}{}'.format(protocol, host, port),
                protocol=protocol, host=host, port=port)


class Supervisor(dict):

    Null = {
        'identification': None,
        'api_version': None,
        'version': None,
        'supervisor_version': None,
        'processes': {},
        'running': False,
        'pid': None
    }

    def __init__(self, name, url):
        super(Supervisor, self).__init__(self.Null)
        self.name = self['name'] = name
        self.url = self['url'] = url
        self.log = log.getChild(name)
        addr = sanitize_url(url, protocol='tcp', host=name, port=9002)
        self.address = addr['url']
        self.host = self['host'] = addr['host']
        self.server = zerorpc.Client(self.address, timeout=5)
        # fill supervisor info before events start coming in
        self.event_loop = spawn(self.run)

    def __repr__(self):
        return '{}(name={})'.format(self.__class__.__name__, self.name)

    def __eq__(self, other):
        this, other = dict(self), dict(other)
        this_p = this.pop('processes')
        other_p = other.pop('processes')
        return this == other and this_p.keys() == other_p.keys()

    def run(self):
        while True:
            try:
                self.refresh()
                for event in self.server.event_stream():
                    self.handle_event(event)
            except zerorpc.LostRemote:
                self.log.info('Lost remote to {}'.format(self.name))
            except zerorpc.TimeoutExpired:
                self.log.info('Timeout expired on {}'.format(self.name))

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

    def create_base_info(self):
        return dict(self.Null, name=self.name, url=self.url, host=self.host)

    def read_info(self):
        info = self.create_base_info()
        server = self.server
        info['pid']= pid = server.supervisor_getPID()
        info['running'] = True
        info['identification'] = server.supervisor_getIdentification()
        info['api_version'] = server.supervisor_getAPIVersion()
        info['supervisor_version'] = server.supervisor_getSupervisorVersion()
        info['processes'] = processes = {}
        for proc in server.supervisor_getAllProcessInfo():
            process = Process(self, proc)
            processes[process['uid']] = process
        return info

    def update_info(self, info):
        if self == info:
            this_p, info_p = self['processes'], info['processes']
            if this_p != info_p:
                for name, process in info_p.items():
                    if process != this_p[name]:
                        Dispatcher.send(process, 'process_changed')
            self.update(info)
        else:
            self.update(info)
            Dispatcher.send(self, 'supervisor_changed')

    def refresh(self):
        try:
            info = self.read_info()
        except:
            info = self.create_base_info()
            raise
        finally:
            self.update_info(info)

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
        result = self.server.supervisor_restart()
        if result:
            Dispatcher.info('Restarted {}'.format(self.name))
        else:
            Dispatcher.error('Error restarting {}'.format(self.name))

    def reread(self):
        added, changed, removed = self.server.supervisor_reloadConfig()[0]
        Dispatcher.info('Reread config of {} ' \
                        '({} added; {} changed; {} disappeared)'.format(
                        self.name, len(added), len(changed), len(removed)))

    def shutdown(self):
        result = self.server.supervisor_shutdown()
        if result:
            Dispatcher.info('Shut down {}'.format(self.name))
        else:
            Dispatcher.error('Error shutting down {}'.format(self.name))


class Process(dict):

    Null = {
        'running': False,
        'pid': None,
        'state': None,
        'statename': 'UNKNOWN'
    }

    def __init__(self, supervisor, *args, **kwargs):
        super(Process, self).__init__(self.Null)
        if args:
            self.update(args[0])
        self.update(kwargs)
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
        return self.supervisor.server

    @property
    def full_name(self):
        return self['full_name']

    def handle_event(self, event):
        event_name = event['eventname']
        if event_name.startswith('PROCESS_STATE'):
            payload = event['payload']
            info = payload.get('process')
            if info is not None:
                old = self.update_info(info)
                if old != self:
                    old_state, new_state = old['statename'], self['statename']
                    Dispatcher.send(self, event='process_changed')
                    if old_state != new_state:
                        Dispatcher.info('{} changed from {} to {}'
                                        .format(self, old_state, new_state))

    def read_info(self):
        info = dict(self.Null)
        try:
            info.update(self.server.supervisor_getProcessInfo(self.full_name))
        except Exception as err:
            self.log.warn('Failed to read info from %s: %s', self['uid'], err)
        return info

    def update_info(self, info):
        old = dict(self)
        info['running'] = info['state'] in RUNNING_STATES
        self.update(info)
        return old

    def refresh(self):
        info = self.read_info()
        self.update_info(info)

    def start(self):
        try:
            self.server.supervisor_startProcess(self.full_name, timeout=30)
        except:
            message = 'Error trying to start {}!'.format(self)
            Dispatcher.error(message)
            self.log.exception(message)

    def stop(self):
        try:
            self.server.supervisor_stopProcess(self.full_name)
        except:
            message = 'Failed to stop {}'.format(self['uid'])
            Dispatcher.warning(message)
            self.log.exception(message)

    def restart(self):
        if self['running']:
            self.stop()
        self.start()

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

    supervisors = {}
    config = dict(dft_global, supervisors=supervisors)
    config.update(parser.items('global'))
    tasks = []
    for section in parser.sections():
        if not section.startswith('supervisor:'):
            continue
        name = section[len('supervisor:'):]
        section_items = dict(parser.items(section))
        url = section_items.get('url', '')
        supervisors[name] = Supervisor(name, url)
    return config


class Dispatcher(object):

    clients = []

    @classmethod
    def send(cls, payload, event):
        data = json.dumps(dict(payload=payload, event=event))
        event = 'data: {0}\n\n'.format(data)
        for client in cls.clients:
            client.put(event)

    @classmethod
    def notification(cls, message, level):
        payload = dict(message=message, level=level, time=time.time())
        cls.send(payload, 'notification')

    @classmethod
    def info(cls, message):
        cls.notification(message, 'INFO')

    @classmethod
    def warning(cls, message):
        logging.warning(message)
        cls.notification(message, 'WARNING')

    @classmethod
    def error(cls, message):
        logging.error(message)
        cls.notification(message, 'ERROR')


class Multivisor(object):

    def __init__(self, options):
        self.options = options
        self.reload()

    @property
    def config(self):
        if self._config is None:
            self._config = load_config(self.options.config_file)
        return self._config

    def reload(self):
        self._config = None
        return self.config

    @property
    def supervisors(self):
        return self.config['supervisors']

    def refresh(self):
        tasks = [spawn(supervisor.refresh)
                 for supervisor in self.supervisors.values()]
        joinall(tasks)

    def get_supervisor(self, name):
        return self.supervisors[name]

    def get_process(self, uid):
        _, supervisor = uid.split('@', 1)
        return self.supervisors[supervisor]['processes'][uid]

    def add_listener(self, client):
        Dispatcher.clients.append(client)

    def remove_listener(self, client):
        Dispatcher.clients.remove(client)

    def run_forever(self):
        #self._event_loop = spawn(event_loop)
        while True:
            self.poll_supervisors()
            sleep(self.options.poll_period)


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
def reload():
    app.multivisor.reload()
    return 'OK'


@app.route("/refresh")
def refresh():
    app.multivisor.refresh()
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
    server = supervisor.server
    if stream == 'out':
        tail = server.supervisor_tailProcessStdoutLog
    else:
        tail = server.supervisor_tailProcessStderrLog
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

    bind = sanitize_url(options.bind, host='0', port=22000)['url']

    app.multivisor = Multivisor(options)

#    app_task = spawn(app.multivisor.run_forever)

    from gevent.wsgi import WSGIServer

    http_server = WSGIServer(bind, application=app)
    logging.info('Start accepting requests')
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        log.info('Ctrl-C pressed. Bailing out')


if __name__ == "__main__":
    main()
