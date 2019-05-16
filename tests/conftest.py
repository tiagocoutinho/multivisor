import os
import signal
import subprocess
from time import sleep

import pytest
import requests
from requests import ConnectionError

from multivisor.multivisor import Multivisor
from multivisor.multivisor import Supervisor
from multivisor.server.web import get_parser


@pytest.fixture
def basic_options():
    args = ['-c', 'tests/multivisor_test.conf']
    parser = get_parser(args)
    options = parser.parse_args(args)
    return options


@pytest.fixture
def multivisor_instance(basic_options):
    multivisor = Multivisor(basic_options)
    return multivisor


@pytest.fixture(autouse=True, scope='session')
def supervisor_test001():
    subprocess.call('pkill -9 -f "supervisord -n -c tests/supervisord_test001.conf"', shell=True)
    p = subprocess.Popen('supervisord -n -c tests/supervisord_test001.conf', shell=True, stdout=subprocess.PIPE,
                         preexec_fn=os.setsid)

    address = 'tcp://localhost:9073'
    supervisor = Supervisor('test1', address)
    info = supervisor.read_info()

    # wait until supervisor is running
    while not info['running']:
        sleep(0.1)
        info = supervisor.read_info()

    yield p
    try:
        os.killpg(os.getpgid(p.pid), signal.SIGTERM)
    except OSError:
        pass  # process already dead


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
    try:
        os.killpg(os.getpgid(p.pid), signal.SIGTERM)
    except OSError:
        pass  # process already dead


@pytest.fixture(scope='session')
def base_url():
    return 'http://localhost:22000'


@pytest.fixture(scope='session')
def api_base_url(base_url):
    return '{}/api'.format(base_url)
