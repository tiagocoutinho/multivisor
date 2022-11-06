# syntax=docker/dockerfile:1
FROM python:3.11-alpine as build

WORKDIR /usr/app
RUN python -m venv /usr/app/venv
ENV PATH="/usr/app/venv/bin:$PATH"

COPY . multivisor/
WORKDIR /usr/app/multivisor

RUN --mount=type=cache,target=/root/.cache/pip pip install --disable-pip-version-check supervisor .[rpc,web]

FROM python:3.11-alpine

RUN mkdir /var/log/supervisord

COPY --from=build /usr/app/venv /usr/app/venv

ENV PATH=/usr/app/venv/bin:$PATH

COPY docker/multivisor/multivisor.conf /etc/
COPY docker/supervisord/ /etc/supervisord
COPY docker/bin/* /usr/local/bin/
