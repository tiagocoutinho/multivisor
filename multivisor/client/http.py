import requests


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
