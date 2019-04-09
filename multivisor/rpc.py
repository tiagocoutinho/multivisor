"""
An extension to the standard supervisor RPC interface which subscribes
to internal supervisor events and dispatches them to 0RPC.

disadvantages: it depends on supervisor internal supervisor.events.subscribe
               interface so its usage is quite risky.
advantages: it avoids creating an eventlistener process just to forward events.

The python environment where supervisor runs must have multivisor installed
"""
import functools
import logging
import os
import queue
import threading

from gevent import hub
from gevent import sleep
from gevent import spawn
from gevent.queue import Queue


from supervisor.events import Event
from supervisor.events import getEventNameByType
from supervisor.events import subscribe
from supervisor.http import NOT_DONE_YET
from supervisor.rpcinterface import SupervisorNamespaceRPCInterface
# unsubscribe only appears in supervisor > 3.3.4
try:
    from supervisor.events import unsubscribe
except ImportError:
    def unsubscribe(*args):
        pass

from zerorpc import LostRemote
from zerorpc import Server
from zerorpc import stream

from .util import sanitize_url


DEFAULT_BIND = 'tcp://*:9002'


def sync(klass):
    def wrap_func(meth):
        @functools.wraps(meth)
        def wrapper(*args, **kwargs):
            args[0]._log.debug('0RPC: called {}'.format(meth.__name__))
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


# When supervisor is asked to restart, it closes file descriptors
# from 5..1024. Since we are not able to restart the ZeroRPC server
# (see https://github.com/0rpc/zerorpc-python/issues/208) this patch
# prevents supervisor from closing the gevent pipes and 0MQ sockets
# This is a really agressive move but seems to work until the above
# bug is solved
from supervisor.options import ServerOptions
ServerOptions.cleanup_fds = lambda options : None


@sync
class MultivisorNamespaceRPCInterface(SupervisorNamespaceRPCInterface):

    def __init__(self, supervisord, bind):
        SupervisorNamespaceRPCInterface.__init__(self, supervisord)
        self._bind = bind
        self._channel = queue.Queue()
        self._event_channels = set()
        self._server = None
        self._watcher = None
        self._shutting_down = False
        self._log = logging.getLogger('MVRPC')

    def _start(self):
        subscribe(Event, self._handle_event)

    def _stop(self):
        unsubscribe(Event, self._handle_event)
        self._shutting_down = True

    def _shutdown(self):
        # disconnect all streams
        for channel in self._event_channels:
            channel.put(None)
        if self._server is not None:
            self._server.stop()
            self._server.close()

    def _process_event(self, event):
        if self._shutting_down:
            return
        event_name = getEventNameByType(event.__class__)
        stop_event = event_name == 'SUPERVISOR_STATE_CHANGE_STOPPING'
        if stop_event:
            self._log.info('supervisor stopping!')
            self._stop()
        elif event_name.startswith('TICK'):
            return
        try:
            # old supervisor version
            payload_str = event.payload()
        except AttributeError:
            payload_str = str(event)
        payload = dict((x.split(':') for x in payload_str.split()))
        if event_name.startswith('PROCESS_STATE'):
            pname = "{}:{}".format(payload['groupname'], payload['processname'])
            payload['process'] = self.getProcessInfo(pname)
        # broadcast the event to clients
        server = self.supervisord.options.identifier
        new_event = dict(pool='multivisor', server=server,
                         eventname=event_name, payload=payload)
        for channel in self._event_channels:
            channel.put(new_event)
        if stop_event:
            self._shutdown()

    # called on 0RPC server thread
    def _dispatch_event(self):
        while not self._channel.empty():
            event = self._channel.get()
            self._process_event(event)

    # called on main thread
    def _handle_event(self, event):
        if self._server is None:
            reply = start_rpc_server(self, self._bind)
            if isinstance(reply, Exception):
                self._log.critical('severe 0RPC error: %s', reply)
                self._stop()
                self._shutdown()
                return
            self._server, self._watcher = reply
        self._channel.put(event)
        self._watcher.send()

        # handle stop synchronously
        event_name = getEventNameByType(event.__class__)
        if event_name == 'SUPERVISOR_STATE_CHANGE_STOPPING':
            self._server._stop_event.wait()
            self._server = None
            self._watcher = None

    @stream
    def event_stream(self):
        self._log.info('client connected to stream')
        channel = Queue()
        self._event_channels.add(channel)
        try:
            yield 'First event to trigger connection. Please ignore me!'
            for event in channel:
                if event is None:
                    self._log.info('stop: closing client')
                    return
                yield event
        except LostRemote as e:
            self._log.info('remote end of stream disconnected')
        finally:
            self._event_channels.remove(channel)


def start_rpc_server(multivisor, bind):
    future_server = queue.Queue(1)
    th = threading.Thread(target=run_rpc_server, name='RPCServer',
                          args=(multivisor, bind, future_server))
    th.daemon = True
    th.start()
    return future_server.get()


def run_rpc_server(multivisor, bind, future_server):
    multivisor._log.info('0RPC: spawn server on {}...'.format(os.getpid()))
    watcher = hub.get_hub().loop.async()
    stop_event = threading.Event()
    watcher.start(lambda: spawn(multivisor._dispatch_event))
    try:
        server = Server(multivisor)
        server._stop_event = stop_event
        server.bind(bind)
        future_server.put((server, watcher))
        multivisor._log.info('0RPC: server running!')
        server.run()
        multivisor._log.info('0RPC: server stopped!')
    except Exception as err:
        future_server.put(err)
    finally:
        watcher.stop()
        del server
        # prevent reusage of this loop because supervisor closes all ports
        # when a restart happens. It actually doesn't help preventing a crash
        hub.get_hub().destroy(destroy_loop=True)
        multivisor._log.info('0RPC: server thread destroyed!')
    stop_event.set()


def make_rpc_interface(supervisord, bind=DEFAULT_BIND):
    # Uncomment following lines to configure python standard logging
    #log_level = logging.INFO
    #log_fmt = '%(asctime)-15s %(levelname)s %(threadName)-8s %(name)s: %(message)s'
    #logging.basicConfig(level=log_level, format=log_fmt)

    url = sanitize_url(bind, protocol='tcp', host='*', port=9002)
    multivisor = MultivisorNamespaceRPCInterface(supervisord, url['url'])
    multivisor._start()
    return multivisor
