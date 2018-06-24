"""
An extension to the standard supervisor RPC interface which subscribes
to internal supervisor events and dispatches them to 0RPC.

disadvantages: it depends on supervisor internal supervisor.events.subscribe
               interface so its usage is quite risky.
advantages: it avoids creating an eventlistener process just to forward events.

limitations: for now it is fixing the 0RPC port to 9003.

The python environment where supervisor runs must have multivisor installed
"""

import os
import queue
import functools
import threading

from gevent import spawn, hub, sleep
from gevent.queue import Queue
from zerorpc import stream, Server

from supervisor.http import NOT_DONE_YET
from supervisor.events import subscribe, unsubscribe, Event, getEventNameByType
from supervisor.rpcinterface import SupervisorNamespaceRPCInterface


DEFAULT_BIND = 'tcp://*:9003'

import threading
def sync(klass):
    def wrap_func(meth):
        @functools.wraps(meth)
        def wrapper(*args, **kwargs):
            args[0].log.debug('0RPC: called {}'.format(meth.__name__))
            result = meth(*args, **kwargs)
            if callable(result):
                r = NOT_DONE_YET
                while r is NOT_DONE_YET:
                    sleep(0.1)
                    r = result()
                result = r
            return result
        return wrapper

    for name in dir(klass):
        if name.startswith('_') or name == 'event_stream':
            continue
        meth = getattr(klass, name)
        if not callable(meth):
            continue
        setattr(klass, name, wrap_func(meth))
    return klass


@sync
class MultivisorNamespaceRPCInterface(SupervisorNamespaceRPCInterface):

    def __init__(self, supervisord, channel):
        SupervisorNamespaceRPCInterface.__init__(self, supervisord)
        self._channel = channel
        self._event_channels = set()
        self.log = supervisord.options.logger

    def _handle_event(self):
        while not self._channel.empty():
            event = self._channel.get()
            event = process_event(self, event)
            if event is None:
                return
            self.log.info('0RPC: event received {} (#{} clients)'
                          .format(event['eventname'], len(self._event_channels)))
            for channel in self._event_channels:
                channel.put(event)

    @stream
    def event_stream(self):
        self.log.info('0RPC: client connected to stream')
        channel = Queue()
        self._event_channels.add(channel)
        try:
            yield 'First event to trigger connection. Please ignore me!'
            for event in channel:
                self.log.debug('sending {}'.format(event['eventname']))
                yield event
        except LostRemote as e:
            self.log.info('0RPC: remote end of stream disconnected')
        finally:
            self._event_channels.remove(channel)


SHUTTING_DOWN = False

def process_event(multivisor, event):
    global SHUTTING_DOWN
    if SHUTTING_DOWN:
        return
    event_name = getEventNameByType(event.__class__)
    if event_name == 'SUPERVISOR_STATE_CHANGE_STOPPING':
        unsubscribe(*multivisor._listener)
        SHUTTING_DOWN = True
    if event_name.startswith('TICK'):
        return
    try:
        payload_str = event.payload()
    except AttributeError:
        # old supervisor version
        payload_str = str(event)
    payload = dict((x.split(':') for x in payload_str.split()))
    if event_name.startswith('PROCESS_STATE'):
        pname = "{}:{}".format(payload['groupname'], payload['processname'])
        payload['process'] = multivisor.getProcessInfo(pname)
    return dict(pool='multivisor', server=multivisor.supervisord.options.identifier,
                eventname=event_name, payload=payload)


def event_bridge(channel, watcher, event):
    channel.put(event)
    watcher.send()


def run_rpc_server(bind, multivisor, watch):
    watcher = hub.get_hub().loop.async()
    def handle_event():
        spawn(multivisor._handle_event)
    multivisor.log.info('0RPC: spawn server on {}...'.format(os.getpid()))
    watcher.start(handle_event)
    server = Server(multivisor)
    multivisor._server = server
    server.bind(bind)
    watch.put(watcher)
    multivisor.log.info('0RPC: server running!')
    server.run()


def make_rpc_interface(supervisord, bind=DEFAULT_BIND):
    if '://' not in bind:
        bind = 'tcp://' + bind
    channel = queue.Queue()
    multivisor = MultivisorNamespaceRPCInterface(supervisord, channel)
    # create a one message channel so the RPC server thread can pass us its gevent watcher
    watch = queue.Queue(1)
    th = threading.Thread(target=run_rpc_server, name='RPCServer', args=(bind, multivisor, watch))
    th.daemon = True
    th.start()
    watcher = watch.get()
    listener = Event, functools.partial(event_bridge, channel, watcher)
    multivisor._listener = listener
    subscribe(*listener)
    return multivisor
