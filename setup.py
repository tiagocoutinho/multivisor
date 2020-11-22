import sys
from setuptools import setup, find_packages


supervisor = 'supervisor-win' if 'win' in sys.platform else 'supervisor'

extras = {
    'rpc': ['zerorpc', supervisor],
    'web': ['flask', 'werkzeug', 'blinker', 'zerorpc', supervisor],
    'cli': ['maya', 'requests', 'prompt_toolkit>=2', 'blinker'],
}

extras['all'] = list(set.union(*(set(i) for i in extras.values())))

requires = ['six', 'gevent>=1.3']

setup(
    name='multivisor',
    version='5.1.0',
    author='Tiago Coutinho',
    author_email='coutinhotiago@gmail.com',
    description='A centralized supervisor UI (web & CLI)',
    packages=find_packages(),
    package_data={'multivisor.server': ['dist/*',
                                        'dist/static/css/*',
                                        'dist/static/js/*']},
    entry_points=dict(console_scripts=[
        'multivisor=multivisor.server.web:main [web]',
        'multivisor-cli=multivisor.client.cli:main [cli]']),
    extras_require=extras,
    install_requires=requires)
