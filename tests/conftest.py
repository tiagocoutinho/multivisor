import os
import signal
import subprocess
from time import sleep

import pytest

import requests
from requests import ConnectionError


@pytest.fixture(autouse=True, scope='session')
def supervisor_test001():
    p = subprocess.Popen('supervisord -n -c tests/supervisord_test001.conf', shell=True, stdout=subprocess.PIPE,
                         preexec_fn=os.setsid)
    yield p
    os.killpg(os.getpgid(p.pid), signal.SIGTERM)


@pytest.fixture(autouse=True, scope='session')
def server(supervisor_test001, base_url):
    p = subprocess.Popen('multivisor -c tests/multivisor_test.conf', shell=True, stdout=subprocess.PIPE,
                         preexec_fn=os.setsid)
    retires = 0
    max_retries = 10
    while retires < max_retries:
        try:
            requests.get(base_url)
            break
        except ConnectionError:
            sleep(0.5)
            retires += 1

    yield p
    os.killpg(os.getpgid(p.pid), signal.SIGTERM)


@pytest.fixture(scope='session')
def base_url():
    return 'http://localhost:22000'


@pytest.fixture(scope='session')
def api_base_url(base_url):
    return '{}/api'.format(base_url)
