import json
import time

import louie
import requests


class Multivisor(object):

    def __init__(self, url):
        self.url = url
        self._status = None
        self.notifications = []

    def stop_processes(self, *names):
        return self.post('/process/stop', data=dict(uid=[','.join(names)]))

    def restart_processes(self, *names):
        return self.post('/process/restart', data=dict(uid=[','.join(names)]))

    @property
    def status(self):
        if self._status is None:
            self._status = self.get_status()
        return self._status

    @staticmethod
    def _update_status_stats(status):
        supervisors, processes = status['supervisors'], status['processes']
        s_stats = dict(running=sum((s['running']
                                    for s in status['supervisors'].itervalues())),
                       total=len(supervisors))
        s_stats['stopped'] = s_stats['total'] - s_stats['running']
        p_stats = dict(running=sum((p['running']
                                    for p in status['processes'].itervalues())),
                       total=len(processes))
        p_stats['stopped'] = p_stats['total'] - p_stats['running']
        stats = dict(supervisors=s_stats, processes=p_stats)
        status['stats'] = stats
        return stats

    def get_status(self):
        status = self.get('/refresh').json()
        # reorganize status per process
        status['processes'] = processes = {}
        for supervisor in status['supervisors'].values():
            processes.update(supervisor['processes'])
        self._update_status_stats(status)
        return status

    def refresh_status(self):
        self._status = None
        return self.status

    def get(self, url, params=None, **kwargs):
        result = requests.get(self.url + url, params=params, **kwargs)
        result.raise_for_status()
        return result

    def post(self, url, data=None, json=None, **kwargs):
        result = requests.post(self.url + url, data=data, json=json, **kwargs)
        result.raise_for_status()
        return result

    def __getitem__(self, item):
        return self.get(item).json()

    def __setitem__(self, item, value):
        self.post(item, data=value)

    def events(self):
        stream = self.get('/stream', stream=True)
        for line in stream.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data:'):
                    line = line[5:]
                    try:
                        yield json.loads(line)
                    except ValueError:
                        print 'error', line

    def run(self):
        for event in self.events():
            status = self.status
            name, payload = event['event'], event['payload']
            if name == 'process_changed':
                status['processes'][payload['uid']].update(payload)
                self._update_status_stats(status)
            elif name == 'notification':
                self.notifications.append(payload)
            louie.send(signal=name, sender=self, payload=payload)
