import requests

from tests.functions import assert_fields_in_object
from tests.conftest import *


@pytest.mark.usefixtures('api_base_url')
def test_data(api_base_url):
    url = "{}/data".format(api_base_url)
    response = requests.get(url)
    assert response.status_code == 200
    print response.json()
    data = response.json()
    assert_fields_in_object(['name', 'supervisors'], data)
    assert 'test001' in data['supervisors']
    supervisor = data['supervisors']['test001']
    assert_fields_in_object([
        'processes',
        'name',
        'url',
        'pid',
        'running',
        'host',
        'version',
        'identification',
        'supervisor_version',
        'api_version'
    ], supervisor)

    assert supervisor['running']
