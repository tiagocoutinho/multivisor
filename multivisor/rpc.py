"""
An extension to the standard supervisor RPC interface which subscribes
to internal supervisor events and dispatches them to 0RPC.

disadvantages: it depends on supervisor internal supervisor.events.subscribe
               interface so itts usage is quite risky.
advantages: it avoids creating an eventlistener process just to forward events.

limitations: for now it is fixing the 0RPC port to 9003.

In development phase. Not for production
"""

from functools import partial

import zmq
import msgpack

from supervisor.events import subscribe, Event, getEventNameByType
from supervisor.rpcinterface import make_main_rpcinterface


DEFAULT_BIND = 'tcp://*:9003'


def event_listener(supervisord, socket, event):
    try:
        payload_str = event.payload()
    except AttributeError:
        payload_str = str(event)
    payload = dict((x.split(':') for x in payload_str.split()))
    event_dict = dict(
        pool='multivisor',
        server=supervisord.options.identifier,
        eventname=getEventNameByType(event.__class__),
        payload=payload)
    package = msgpack.packb(event_dict)
    socket.send(package)


def make_rpc(supervisord, bind=DEFAULT_BIND):
    if '://' not in bind:
        bind = 'tcp://' + bind
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind(bind)
    subscribe(Event, partial(event_listener, supervisord, socket))
    make_main_rpcinterface(supervisord)
