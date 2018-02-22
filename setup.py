import os
from setuptools import setup, find_packages
from setuptools.command.build_py import build_py


class Build(build_py):
    def run(self):
        os.system('npm run build')
        build_py.run(self)


setup(
    name='multivisor',
    version='2.1.1',
    author='Tiago Coutinho',
    author_email='coutinhotiago@gmail.com',
    description='A centralized supervisor web UI',
    cmdclass=dict(build_py=Build),
    packages=find_packages(),
    package_data=dict(multivisor=['dist/*',
                                  'dist/static/css/*',
                                  'dist/static/js/*']),
    entry_points=dict(console_scripts=['multivisor=multivisor.server:main']),
    install_requires=['flask', 'louie', 'gevent', 'supervisor'])
