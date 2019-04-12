from setuptools import find_packages
from setuptools import setup

server_requires = [
    'flask',
    'gevent',
    ''
]

setup(
    name='multivisor',
    version='5.0.2',
    author='Tiago Coutinho',
    author_email='coutinhotiago@gmail.com',
    description='A centralized supervisor UI (web & CLI)',
    packages=find_packages(),
    package_data={
        'multivisor.server': [
            'dist/*',
            'dist/static/css/*',
            'dist/static/js/*'
        ]
    },
    entry_points={
        'console_scripts': [
            'multivisor=multivisor.server.web:main [web]',
            'multivisor-cli=multivisor.client.cli:main [cli]'
        ]
    },
    install_requires=[
        'flask',
        'gevent',
        'supervisor',  # keep
        'zerorpc',
        'louie',
        'maya',
        'requests',
        'prompt_toolkit>=2.0.0,<2.1.0'
    ]
)
