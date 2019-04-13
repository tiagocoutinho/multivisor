from setuptools import find_packages
from setuptools import setup

web_requires = [
    'flask',
    'louie',
]

client_requires = [
    'maya',
    'louie',
    'requests',
    'prompt_toolkit>=2.0.0,<2.1.0',
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
    install_requires=[
        'gevent',
        'supervisor',
        'zerorpc',
    ],
    extras_require={
        'web': web_requires,
        'cli': client_requires,
    },
    entry_points={
        'console_scripts': [
            'multivisor=multivisor.server.web:main [web]',
            'multivisor-cli=multivisor.client.cli:main [cli]'
        ]
    }
)
