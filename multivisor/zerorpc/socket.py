# Vendored from zerorpc-python, see LICENSE in this directory.

from .context import Context
from .events import Events


class SocketBase(object):

    def __init__(self, zmq_socket_type, context=None):
        self._context = context or Context.get_instance()
        self._events = Events(zmq_socket_type, context)

    def close(self):
        self._events.close()

    def connect(self, endpoint, resolve=True):
        return self._events.connect(endpoint, resolve)

    def bind(self, endpoint, resolve=True):
        return self._events.bind(endpoint, resolve)

    def disconnect(self, endpoint, resolve=True):
        return self._events.disconnect(endpoint, resolve)

    @property
    def debug(self):
        return self._events.debug

    @debug.setter
    def debug(self, v):
        self._events.debug = v
