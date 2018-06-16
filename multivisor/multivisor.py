#!/usr/bin/env python

import os
import json
import time
import logging
import weakref
from ConfigParser import SafeConfigParser

import louie
import zerorpc
from gevent import queue, spawn, sleep, joinall
from supervisor.xmlrpc import Faults
from supervisor.states import RUNNING_STATES

from .util import sanitize_url, filter_patterns

log = logging.getLogger('multivisor')


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
                for i, event in enumerate(self.server.event_stream()):
                    # ignore first event. It serves only to trigger
                    # connection and avoid TimeoutExpired
                    if i != 0:
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
        elif name.startswith('PROCESS_GROUP'):
            self.refresh()
        elif name.startswith('PROCESS_STATE'):
            payload = event['payload']
            puid = '{}:{}:{}'.format(self.name,
                                     payload['groupname'],
                                     payload['processname'])
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
                        send(process, 'process_changed')
            self.update(info)
        else:
            self.update(info)
            send(self, 'supervisor_changed')

    def refresh(self):
        try:
            info = self.read_info()
        except:
            info = self.create_base_info()
            raise
        finally:
            self.update_info(info)

    def update_server(self, group_names=()):
        server = self.server
        try:
            added, changed, removed = server.supervisor_reloadConfig()[0]
        except zerorpc.RemoteError as rerr:
            error(rerr.msg)
            return

        # If any gnames are specified we need to verify that they are
        # valid in order to print a useful error message.
        if group_names:
            groups = set()
            for info in server.supervisor_getAllProcessInfo():
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
            results = server.supervisor_stopProcessGroup(gname)
            self.log.debug('stopped process group %s', gname)

            fails = [res for res in results
                     if res['status'] == Faults.FAILED]
            if fails:
                self.log.debug("%s as problems; not removing", gname)
                continue
            server.supervisor_removeProcessGroup(gname)
            self.log.debug("removed process group %s", gname)

        for gname in changed:
            if group_names and gname not in group_names:
                continue
            server.supervisor_stopProcessGroup(gname)
            self.log.debug('stopped process group %s', gname)

            server.supervisor_removeProcessGroup(gname)
            server.supervisor_addProcessGroup(gname)
            self.log.debug('updated process group %s', gname)

        for gname in added:
            if group_names and gname not in group_names:
                continue
            server.supervisor_addProcessGroup(gname)
            self.log.debug('added process group %s', gname)

        self.log.info('Updated %s', self.name)

    def _reread(self):
        return self.server.supervisor_reloadConfig()

    def restart(self):
        # do a reread. If there is an error (bad config) inform the user and
        # and refuse to restart
        try:
            self._reread()
        except zerorpc.RemoteError as rerr:
            error('Cannot restart: {}'.format(rerr.msg))
            return
        result = self.server.supervisor_restart(timeout=30)
        if result:
            info('Restarted {}'.format(self.name))
        else:
            error('Error restarting {}'.format(self.name))

    def reread(self):
        try:
            added, changed, removed = self._reread()[0]
        except zerorpc.RemoteError as rerr:
            error(rerr.msg)
        else:
            info('Reread config of {} ' \
                            '({} added; {} changed; {} disappeared)'.format(
                            self.name, len(added), len(changed), len(removed)))

    def shutdown(self):
        result = self.server.supervisor_shutdown()
        if result:
            info('Shut down {}'.format(self.name))
        else:
            error('Error shutting down {}'.format(self.name))


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
        uid = '{}:{}'.format(supervisor_name, full_name)
        self.log = log.getChild(uid)
        self.supervisor = weakref.proxy(supervisor)
        self['full_name'] = full_name
        self['running'] = self['state'] in RUNNING_STATES
        self['supervisor'] = supervisor_name
        self['host'] = supervisor['host']
        self['uid'] = uid

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
            proc_info = payload.get('process')
            if proc_info is not None:
                old = self.update_info(proc_info)
                if old != self:
                    old_state, new_state = old['statename'], self['statename']
                    send(self, event='process_changed')
                    if old_state != new_state:
                        info('{} changed from {} to {}'
                                        .format(self, old_state, new_state))

    def read_info(self):
        proc_info = dict(self.Null)
        try:
            proc_info.update(self.server.supervisor_getProcessInfo(self.full_name))
        except Exception as err:
            self.log.warn('Failed to read info from %s: %s', self['uid'], err)
        return proc_info

    def update_info(self, proc_info):
        old = dict(self)
        proc_info['running'] = proc_info['state'] in RUNNING_STATES
        self.update(proc_info)
        return old

    def refresh(self):
        proc_info = self.read_info()
        self.update_info(proc_info)

    def start(self):
        try:
            self.server.supervisor_startProcess(self.full_name, timeout=30)
        except:
            message = 'Error trying to start {}!'.format(self)
            error(message)
            self.log.exception(message)

    def stop(self):
        try:
            self.server.supervisor_stopProcess(self.full_name)
        except:
            message = 'Failed to stop {}'.format(self['uid'])
            warning(message)
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


def send(payload, event):
    louie.send(signal=event, sender='multivisor', payload=payload)


def notification(message, level):
    payload = dict(message=message, level=level, time=time.time())
    send(payload, 'notification')


def info(message):
    notification(message, 'INFO')


def warning(message):
    logging.warning(message)
    notification(message, 'WARNING')


def error(message):
    logging.error(message)
    notification(message, 'ERROR')


class Multivisor(object):

    def __init__(self, options):
        self.options = options
        self.reload()

    @property
    def config(self):
        if self._config is None:
            self._config = load_config(self.options.config_file)
        return self._config

    @property
    def config_file_content(self):
        with open(self.options.config_file) as config_file:
            return config_file.read()

    def reload(self):
        self._config = None
        return self.config

    @property
    def supervisors(self):
        return self.config['supervisors']

    @property
    def processes(self):
        procs = (svisor['processes'] for svisor in self.supervisors.values())
        return { puid: proc for sprocs in procs
                 for puid, proc in sprocs.items() }

    def refresh(self):
        tasks = [spawn(supervisor.refresh)
                 for supervisor in self.supervisors.values()]
        joinall(tasks)

    def get_supervisor(self, name):
        return self.supervisors[name]

    def get_process(self, uid):
        supervisor, _ = uid.split(':', 1)
        return self.supervisors[supervisor]['processes'][uid]

    def _do_supervisors(self, operation, *names):
        supervisors = (self.get_supervisor(name) for name in names)
        tasks = [spawn(operation, supervisor) for supervisor in supervisors]
        joinall(tasks)

    def _do_processes(self, operation, *patterns):
        procs = self.processes
        puids = filter_patterns(procs, patterns)
        tasks = [spawn(operation, procs[puid]) for puid in puids]
        joinall(tasks)

    def update_supervisors(self, *names):
        self._do_supervisors(Supervisor.update_server, *names)

    def restart_supervisors(self, *names):
        self._do_supervisors(Supervisor.restart, *names)

    def reread_supervisors(self, *names):
        self._do_supervisors(Supervisor.reread, *names)

    def shutdown_supervisors(self, *names):
        self._do_supervisors(Supervisor.shutdown, *names)

    def restart_processes(self, *patterns):
        self._do_processes(Process.restart, *patterns)

    def stop_processes(self, *patterns):
        self._do_processes(Process.stop, *patterns)

