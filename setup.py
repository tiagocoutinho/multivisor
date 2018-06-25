from setuptools import setup, find_packages

setup(
    name='multivisor',
    version='4.2.1',
    author='Tiago Coutinho',
    author_email='coutinhotiago@gmail.com',
    description='A centralized supervisor UI (web & CLI)',
    packages=find_packages(),
    package_data={'multivisor.server': ['dist/*',
                                        'dist/static/css/*',
                                        'dist/static/js/*']},
    entry_points=dict(console_scripts=[
        'multivisor=multivisor.server.web:main',
        'multivisor-cli=multivisor.client.cli:main',
        'multivisor-dispatcher=multivisor.dispatcher:main',
        'multivisor-rpc=multivisor.server.zrpc:main']),
    install_requires=['flask', 'gevent', 'supervisor', 'zerorpc', 'louie',
                      'maya', 'requests', 'prompt_toolkit>=2.0.0,<2.1.0'])
