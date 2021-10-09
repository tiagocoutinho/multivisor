import sys
from setuptools import setup


supervisor = "supervisor-win" if "win" in sys.platform else "supervisor"

extras = {
    "rpc": ["zerorpc", supervisor],
    "web": ["flask", "werkzeug", "blinker", "zerorpc", supervisor],
    "cli": ["maya", "requests", "prompt_toolkit>=2", "blinker"],
    "test": ["pytest>=6", "pytest-cov>=2", "flake8>=3.9", "tox>=3.24"],
}

extras["all"] = list(set.union(*(set(i) for i in extras.values())))

if __name__ == "__main__":
    setup(
        extras_require=extras,
    )
