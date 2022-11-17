# syntax=docker/dockerfile:1
FROM python:3.11-alpine as build

RUN mkdir /var/log/supervisord

WORKDIR /usr/app/multivisor

RUN python -m venv /usr/app/venv
ENV PATH=/usr/app/venv/bin:$PATH

COPY multivisor ./multivisor
COPY setup.cfg setup.py README.md requirements.txt requirements-dev.txt ./

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-dev.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --disable-pip-version-check --no-deps -e .[all]

COPY docker/multivisor/multivisor.conf /etc/
COPY docker/supervisord/ /etc/supervisord
COPY docker/bin/* /usr/local/bin/
