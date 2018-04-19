import collections

import requests


def group_processes_status_by(processes, group_by='group', filter=None):
    result = collections.defaultdict(lambda : dict(processes={}))
    if filter is None:
        filter = lambda p: True
    for uid, process in processes.items():
        if not filter(process):
            continue
        name = process[group_by]
        order = result[name]
        order['name'] = name
        order['processes'][uid] = process
    return result


def processes_status(status, group_by='process', filter=None):
    processes = status['processes']
    puid_len = max(map(len, processes))
    template = '{{uid:{}}} {{statename:8}} {{description}}'.format(puid_len)
    result = []
    if filter is None:
        filter = lambda p: True
    if group_by in (None, 'process'):
        for puid in sorted(processes):
            process = processes[puid]
            if filter(process):
                result.append(template.format(**process))
    else:
        grouped = group_processes_status_by(processes, group_by=group_by,
                                            filter=filter)
        for name in sorted(grouped):
            result.append(name + ':')
            for process in grouped[name]['processes'].values():
                result.append('  ' + template.format(**process))
    return result


class Multivisor(object):

    def __init__(self, url):
        self.url = url

    def stop_processes(self, *names):
        return self.post('/process/stop', data=dict(uid=[','.join(names)]))

    def restart_processes(self, *names):
        return self.post('/process/restart', data=dict(uid=[','.join(names)]))

    def get_status(self):
        data = self.get('/refresh').json()
        # reorganize data per process
        data['processes'] = processes = {}
        for supervisor in data['supervisors'].values():
            processes.update(supervisor['processes'])
        return data

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

    def __repr__(self):
        lines = processes_status(self.get_status(), group_by='group')
        return '\n'.join(lines)
