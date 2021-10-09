import gevent
import pytest
import requests

from tests.functions import assert_fields_in_object
from tests.conftest import *


@pytest.mark.usefixtures("api_base_url")
def test_data_view(api_base_url):
    url = "{}/data".format(api_base_url)
    response = requests.get(url)
    assert response.status_code == 200
    data = response.json()
    assert_fields_in_object(["name", "supervisors"], data)
    assert "test001" in data["supervisors"]
    supervisor = data["supervisors"]["test001"]
    assert_fields_in_object(
        [
            "processes",
            "name",
            "url",
            "pid",
            "running",
            "host",
            "version",
            "identification",
            "supervisor_version",
            "api_version",
        ],
        supervisor,
    )

    assert supervisor["running"]
    processes = supervisor["processes"]
    for name, process in processes.items():
        assert_fields_in_object(
            [
                "stderr_logfile",
                "description",
                "statename",
                "pid",
                "stdout_logfile",
                "full_name",
                "supervisor",
                "logfile",
                "exitstatus",
            ],
            process,
        )


@pytest.mark.usefixtures("api_base_url")
def test_config_view(api_base_url):
    url = "{}/config/file".format(api_base_url)
    response = requests.get(url)
    assert response.status_code == 200
    data = response.json()
    assert "content" in data


@pytest.mark.usefixtures("api_base_url")
def test_list_processes_view(api_base_url):
    url = "{}/process/list".format(api_base_url)
    response = requests.get(url)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 10


@pytest.mark.usefixtures("api_base_url")
def test_process_info_view(api_base_url):
    uid = "test001:PLC:wcid00d"
    url = "{}/process/info/{}".format(api_base_url, uid)
    response = requests.get(url)
    assert response.status_code == 200
    process_data = response.json()
    keys = [
        u"logfile",
        u"statename",
        u"group",
        u"description",
        u"pid",
        u"stderr_logfile",
        u"stop",
        u"running",
        u"name",
        u"start",
        u"state",
        u"spawnerr",
        u"full_name",
        u"host",
        u"supervisor",
        u"now",
        u"exitstatus",
        u"stdout_logfile",
        u"uid",
    ]

    assert_fields_in_object(keys, process_data)
    assert process_data["uid"] == uid
    assert process_data["supervisor"] == "test001"
    assert process_data["group"] == "PLC"
    assert process_data["name"] == "wcid00d"


@pytest.mark.usefixtures("api_base_url")
def test_supervisor_info_view(api_base_url):
    uid = "test001"
    url = "{}/supervisor/info/{}".format(api_base_url, uid)
    response = requests.get(url)
    assert response.status_code == 200
    supervisor_data = response.json()
    keys = [
        u"processes",
        u"name",
        u"url",
        u"pid",
        u"running",
        u"host",
        u"version",
        u"identification",
        u"supervisor_version",
        u"api_version",
    ]

    assert_fields_in_object(keys, supervisor_data)
    assert supervisor_data["name"] == uid
    assert len(supervisor_data["processes"]) == 10


@pytest.mark.usefixtures("api_base_url")
def test_reload_view(api_base_url):
    url = "{}/admin/reload".format(api_base_url)
    response = requests.get(url)
    assert response.status_code == 200


@pytest.mark.usefixtures("api_base_url")
def test_refresh_view(api_base_url):
    url = "{}/refresh".format(api_base_url)
    response = requests.get(url)
    assert response.status_code == 200


@pytest.mark.usefixtures("api_base_url")
def test_stop_process_view(api_base_url, multivisor_instance):
    multivisor_instance.refresh()  # processes are empty before calling this
    uid = "test001:PLC:wcid00d"
    process = multivisor_instance.get_process(uid)
    # assert process is currently running
    index, max_retries = 0, 10
    while not process["running"]:
        multivisor_instance.refresh()
        process = multivisor_instance.get_process(uid)
        gevent.sleep(0.5)
        if index == max_retries:
            raise AssertionError("Process {} is not running".format(uid))
        index += 1

    # stop the process
    url = "{}/process/stop".format(api_base_url)
    response = requests.post(url, {"uid": uid})
    assert response.status_code == 200

    # assert process is stopped
    index, max_retries = 0, 10
    while process["running"]:
        multivisor_instance.refresh()
        process = multivisor_instance.get_process(uid)
        gevent.sleep(0.5)
        if index == max_retries:
            raise AssertionError("Process {} is not stopped".format(uid))
        index += 1


@pytest.mark.usefixtures("api_base_url")
def test_restart_process_view(api_base_url, multivisor_instance):
    multivisor_instance.refresh()  # processes are empty before calling this
    uid = "test001:PLC:wcid00d"
    process = multivisor_instance.get_process(uid)
    # stop process if it's currently running
    if process["running"]:
        multivisor_instance.stop_processes(uid)
        assert not process["running"]

    # restart the process
    url = "{}/process/restart".format(api_base_url)
    response = requests.post(url, {"uid": uid})
    assert response.status_code == 200

    # assert process is restarted
    multivisor_instance.refresh()
    process = multivisor_instance.get_process(uid)
    assert process["running"]
