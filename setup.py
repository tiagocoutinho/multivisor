import platform
from setuptools import setup, find_packages


supervisor = "supervisor-win" if platform.system() == "Windows" else "supervisor"

extras = {
    "rpc": ["zerorpc", supervisor],
    "web": ["flask", "werkzeug", "blinker", "zerorpc", supervisor],
    "cli": ["maya", "requests", "prompt_toolkit>=2", "blinker"],
}

extras["all"] = list(set.union(*(set(i) for i in extras.values())))

requires = ["six", "gevent>=1.3"]

with open("README.md") as readme_file:
    readme = readme_file.read()

setup(
    name="multivisor",
    version="6.0.0",
    author="Tiago Coutinho",
    author_email="coutinhotiago@gmail.com",
    description="A centralized supervisor UI (web & CLI)",
    long_description=readme,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    package_data={
        "multivisor.server": ["dist/*", "dist/static/css/*", "dist/static/js/*"]
    },
    entry_points=dict(
        console_scripts=[
            "multivisor=multivisor.server.web:main [web]",
            "multivisor-rpc=multivisor.server.rpc:main [rpc]",
            "multivisor-cli=multivisor.client.cli:main [cli]"
        ]
    ),
    extras_require=extras,
    install_requires=requires,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "Environment :: Web Environment",
        "Framework :: Flask",
        "Intended Audience :: Developers",
        "Intended Audience :: Information Technology",
        "Intended Audience :: System Administrators",
        "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
        "Natural Language :: English",
        "Operating System :: POSIX",
        "Operating System :: Microsoft :: Windows",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Topic :: System :: Boot",
        "Topic :: System :: Monitoring",
        "Topic :: System :: Systems Administration",
    ],
    license="GNU General Public License v3",
)
