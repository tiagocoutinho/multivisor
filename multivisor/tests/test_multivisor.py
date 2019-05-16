import pytest

from tests.conftest import *
from tests.functions import assert_fields_in_object


@pytest.mark.usefixtures('supervisor_test001')
def test_supervisors_attr(multivisor_instance):
    supervisors = multivisor_instance.supervisors
    assert 'test001' in supervisors


@pytest.mark.usefixtures('supervisor_test001')
def test_supervisor_info(multivisor_instance):
    supervisor = multivisor_instance.get_supervisor('test001')
    info = supervisor.read_info()
    assert_fields_in_object(['running', 'host', 'version', 'identification', 'name', 'url',
                             'supervisor_version', 'pid', 'processes', 'api_version'], info)
    assert info['running']
    assert info['host'] == 'localhost'
    assert len(info['processes']) == 10
    assert info['name'] == 'test001'
    assert info['identification'] == 'supervisor'


@pytest.mark.usefixtures('supervisor_test001')
def test_processes_attr(multivisor_instance):
    multivisor_instance.refresh()  # processes are empty before calling this
    processes = multivisor_instance.processes
    assert len(processes) == 10
    assert 'test001:PLC:wcid00d' in processes
    process = processes['test001:PLC:wcid00d']
    assert_fields_in_object(['logfile', 'supervisor', 'description', 'state', 'pid', 'stderr_logfile', 'stop',
                             'host', 'statename', 'name', 'start', 'running', 'stdout_logfile', 'full_name',
                             'group', 'now', 'exitstatus', 'spawnerr', 'uid'], process)
    assert process['supervisor'] == 'test001'
    assert process['full_name'] == 'PLC:wcid00d'
    assert process['name'] == 'wcid00d'
    assert process['uid'] == 'test001:PLC:wcid00d'
    assert process['group'] == 'PLC'
    assert 'tests/log/wcid00d.log' in process['logfile']
    assert 'tests/log/wcid00d.log' in process['stdout_logfile']
    assert process['stderr_logfile'] == ''


@pytest.mark.usefixtures('supervisor_test001')
def test_get_process(multivisor_instance):
    multivisor_instance.refresh()  # processes are empty before calling this
    uid = 'test001:PLC:wcid00d'
    process = multivisor_instance.get_process(uid)
    assert process['supervisor'] == 'test001'
    assert process['full_name'] == 'PLC:wcid00d'
    assert process['name'] == 'wcid00d'
    assert process['uid'] == 'test001:PLC:wcid00d'
    assert process['group'] == 'PLC'
    assert 'tests/log/wcid00d.log' in process['logfile']
    assert 'tests/log/wcid00d.log' in process['stdout_logfile']
    assert process['stderr_logfile'] == ''


@pytest.mark.usefixtures('supervisor_test001')
def test_use_authentication(multivisor_instance):
    assert not multivisor_instance.use_authentication


@pytest.mark.usefixtures('supervisor_test001')
def test_stop_process(multivisor_instance):
    multivisor_instance.refresh()  # processes are empty before calling this
    uid = 'test001:PLC:wcid00d'
    process = multivisor_instance.get_process(uid)
    print(process)
    index, max_retries = 0, 10
    while not process['running']:  # make sure process is running
        multivisor_instance.refresh()
        process = multivisor_instance.get_process(uid)
        sleep(0.5)
        if index == max_retries:
            raise AssertionError("Process {} is not running".format(uid))
        index += 1

    multivisor_instance.stop_processes(uid)
    multivisor_instance.refresh()
    process = multivisor_instance.get_process(uid)
    assert not process['running']


@pytest.mark.usefixtures('supervisor_test001')
def test_restart_process(multivisor_instance):
    multivisor_instance.refresh()  # processes are empty before calling this
    uid = 'test001:PLC:wcid00d'
    process = multivisor_instance.get_process(uid)
    if process['running']:
        multivisor_instance.stop_processes(uid)

    multivisor_instance.restart_processes(uid)
    multivisor_instance.refresh()
    process = multivisor_instance.get_process(uid)
    assert process['running']
