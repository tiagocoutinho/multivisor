#!/usr/bin/env python

from gevent.monkey import patch_all
patch_all(thread=False, sys=True)

import sys
import json

import gevent.queue
from zmq import green as zmq


READY = 'READY\n'
ACKNOWLEDGED = 'RESULT 2\nOK'

DEFAULT_BIND = 'tcp://*:9003'


def signal(msg):
    sys.stdout.write(msg)
    sys.stdout.flush()


def wait_for_event():
    header_line = sys.stdin.readline()
    event = dict((x.split(':') for x in header_line.split()))
    payload_str = sys.stdin.read(int(event['len']))
    event['payload'] = dict((x.split(':') for x in payload_str.split()))
    return event


def event_receiver_loop(q):
    while True:
        signal(READY)
        event = wait_for_event()
        q.put(event)
        signal(ACKNOWLEDGED)


def event_publisher_loop(sock, q):
    for event in q:
        sock.send(json.dumps(event))


def run(bind=DEFAULT_BIND):
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind(bind)
    event_queue = gevent.queue.Queue()

    with socket:
        publisher = gevent.spawn(event_publisher_loop, socket, event_queue)
        receiver = gevent.spawn(event_receiver_loop, event_queue)
        gevent.joinall((publisher, receiver))


def main(args=None):
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--bind', help='bind address',
                        default=DEFAULT_BIND)
    options = parser.parse_args(args)
    bind = options.bind
    if '://' not in bind:
        bind = 'tcp://' + bind
    run(bind)


def client_loop(addr='tcp://localhost:9003'):
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect(addr)
    socket.setsockopt(zmq.SUBSCRIBE, '')
    while True:
        print json.loads(socket.recv())


if __name__ == '__main__':
    main()
