# Vendored from zerorpc-python, see LICENSE in this directory.

import sys
import traceback
from logging import getLogger

import gevent.event
import gevent.pool
import zmq.green as zmq

from . import patterns
from .channel import BufferedChannel, ChannelMultiplexer
from .context import Context
from .decorators import DecoratorBase, rep
from .exceptions import LostRemote, RemoteError, TimeoutExpired
from .heartbeat import HeartBeatOnChannel
from .socket import SocketBase

logger = getLogger(__name__)


class ServerBase(object):

    def __init__(self, channel, methods=None, name=None, context=None,
            pool_size=None, heartbeat=5):
        self._multiplexer = ChannelMultiplexer(channel)

        if methods is None:
            methods = self

        self._context = context or Context.get_instance()
        self._name = name or self._extract_name()
        self._task_pool = gevent.pool.Pool(size=pool_size)
        self._acceptor_task = None
        self._methods = self._filter_methods(ServerBase, self, methods)

        self._inject_builtins()
        self._heartbeat_freq = heartbeat

        for (k, functor) in self._methods.items():
            if not isinstance(functor, DecoratorBase):
                self._methods[k] = rep(functor)

    @staticmethod
    def _filter_methods(cls, self, methods):
        if isinstance(methods, dict):
            return methods
        server_methods = set(k for k in dir(cls) if not k.startswith('_'))
        return dict((k, getattr(methods, k))
                    for k in dir(methods)
                    if callable(getattr(methods, k)) and
                    not k.startswith('_') and k not in server_methods
                    )

    @staticmethod
    def _extract_name(methods):
        return getattr(methods, '__name__', None) \
            or getattr(type(methods), '__name__', None) \
            or repr(methods)

    def close(self):
        self.stop()
        self._multiplexer.close()

    def _format_args_spec(self, args_spec, r=None):
        if args_spec:
            r = [dict(name=name) for name in args_spec[0]]
            default_values = args_spec[3]
            if default_values is not None:
                for arg, def_val in zip(reversed(r), reversed(default_values)):
                    arg['default'] = def_val
        return r

    def _zerorpc_inspect(self):
        methods = dict((m, f) for m, f in self._methods.items()
                    if not m.startswith('_'))
        detailled_methods = dict((m,
            dict(args=self._format_args_spec(f._zerorpc_args()),
                doc=f._zerorpc_doc())) for (m, f) in methods.items())
        return {'name': self._name,
                'methods': detailled_methods}

    def _inject_builtins(self):
        self._methods['_zerorpc_list'] = lambda: [m for m in self._methods
                if not m.startswith('_')]
        self._methods['_zerorpc_name'] = lambda: self._name
        self._methods['_zerorpc_ping'] = lambda: ['pong', self._name]
        self._methods['_zerorpc_help'] = lambda m: \
            self._methods[m]._zerorpc_doc()
        self._methods['_zerorpc_args'] = \
            lambda m: self._methods[m]._zerorpc_args()
        self._methods['_zerorpc_inspect'] = self._zerorpc_inspect

    def __call__(self, method, *args):
        if method not in self._methods:
            raise NameError(method)
        return self._methods[method](*args)

    def _print_traceback(self, protocol_v1, exc_infos):
        logger.exception('')

        exc_type, exc_value, exc_traceback = exc_infos
        if protocol_v1:
            return (repr(exc_value),)
        human_traceback = traceback.format_exc()
        name = exc_type.__name__
        human_msg = str(exc_value)
        return (name, human_msg, human_traceback)

    def _async_task(self, initial_event):
        protocol_v1 = initial_event.header.get(u'v', 1) < 2
        channel = self._multiplexer.channel(initial_event)
        hbchan = HeartBeatOnChannel(channel, freq=self._heartbeat_freq,
                passive=protocol_v1)
        bufchan = BufferedChannel(hbchan)
        exc_infos = None
        event = bufchan.recv()
        try:
            self._context.hook_load_task_context(event.header)
            functor = self._methods.get(event.name, None)
            if functor is None:
                raise NameError(event.name)
            functor.pattern.process_call(self._context, bufchan, event, functor)
        except LostRemote:
            exc_infos = list(sys.exc_info())
            self._print_traceback(protocol_v1, exc_infos)
        except Exception:
            exc_infos = list(sys.exc_info())
            human_exc_infos = self._print_traceback(protocol_v1, exc_infos)
            reply_event = bufchan.new_event(u'ERR', human_exc_infos,
                    self._context.hook_get_task_context())
            self._context.hook_server_inspect_exception(event, reply_event, exc_infos)
            bufchan.emit_event(reply_event)
        finally:
            del exc_infos
            bufchan.close()

    def _acceptor(self):
        while True:
            initial_event = self._multiplexer.recv()
            self._task_pool.spawn(self._async_task, initial_event)

    def run(self):
        self._acceptor_task = gevent.spawn(self._acceptor)
        try:
            self._acceptor_task.get()
        finally:
            self.stop()
            self._task_pool.join(raise_error=True)

    def stop(self):
        if self._acceptor_task is not None:
            self._acceptor_task.kill()
            self._acceptor_task = None


class ClientBase(object):

    def __init__(self, channel, context=None, timeout=30, heartbeat=5,
            passive_heartbeat=False):
        self._multiplexer = ChannelMultiplexer(channel,
                ignore_broadcast=True)
        self._context = context or Context.get_instance()
        self._timeout = timeout
        self._heartbeat_freq = heartbeat
        self._passive_heartbeat = passive_heartbeat

    def close(self):
        self._multiplexer.close()

    def _handle_remote_error(self, event):
        exception = self._context.hook_client_handle_remote_error(event)
        if not exception:
            if event.header.get(u'v', 1) >= 2:
                (name, msg, traceback) = event.args
                exception = RemoteError(name, msg, traceback)
            else:
                (msg,) = event.args
                exception = RemoteError('RemoteError', msg, None)

        return exception

    def _select_pattern(self, event):
        for pattern in self._context.hook_client_patterns_list(
                patterns.patterns_list):
            if pattern.accept_answer(event):
                return pattern
        return None

    def _process_response(self, request_event, bufchan, timeout):
        def raise_error(ex):
            bufchan.close()
            self._context.hook_client_after_request(request_event, None, ex)
            raise ex

        try:
            reply_event = bufchan.recv(timeout=timeout)
        except TimeoutExpired:
            raise_error(TimeoutExpired(timeout,
                    'calling remote method {0}'.format(request_event.name)))

        pattern = self._select_pattern(reply_event)
        if pattern is None:
            raise_error(RuntimeError(
                'Unable to find a pattern for: {0}'.format(request_event)))

        return pattern.process_answer(self._context, bufchan, request_event,
                reply_event, self._handle_remote_error)

    def __call__(self, method, *args, **kargs):
        # `method` may be given as bytes; the zerorpc wire protocol requires
        # a unicode string at the msgpack level.
        if isinstance(method, bytes):
            method = method.decode('utf-8')

        timeout = kargs.get('timeout', self._timeout)
        channel = self._multiplexer.channel()
        hbchan = HeartBeatOnChannel(channel, freq=self._heartbeat_freq,
                passive=self._passive_heartbeat)
        bufchan = BufferedChannel(hbchan, inqueue_size=kargs.get('slots', 100))

        xheader = self._context.hook_get_task_context()
        request_event = bufchan.new_event(method, args, xheader)
        self._context.hook_client_before_request(request_event)
        bufchan.emit_event(request_event)

        if kargs.get('async', False) is False:
            return self._process_response(request_event, bufchan, timeout)

        async_result = gevent.event.AsyncResult()
        gevent.spawn(self._process_response, request_event, bufchan,
                timeout).link(async_result)
        return async_result

    def __getattr__(self, method):
        return lambda *args, **kargs: self(method, *args, **kargs)


class Server(SocketBase, ServerBase):

    def __init__(self, methods=None, name=None, context=None, pool_size=None,
            heartbeat=5):
        SocketBase.__init__(self, zmq.ROUTER, context)
        if methods is None:
            methods = self

        name = name or ServerBase._extract_name(methods)
        methods = ServerBase._filter_methods(Server, self, methods)
        ServerBase.__init__(self, self._events, methods, name, context,
                pool_size, heartbeat)

    def close(self):
        ServerBase.close(self)
        SocketBase.close(self)


class Client(SocketBase, ClientBase):

    def __init__(self, connect_to=None, context=None, timeout=30, heartbeat=5,
            passive_heartbeat=False):
        SocketBase.__init__(self, zmq.DEALER, context=context)
        ClientBase.__init__(self, self._events, context, timeout, heartbeat,
                passive_heartbeat)
        if connect_to:
            self.connect(connect_to)

    def close(self):
        ClientBase.close(self)
        SocketBase.close(self)
