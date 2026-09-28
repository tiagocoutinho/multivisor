# Vendored from zerorpc-python, see LICENSE in this directory.


class ChannelBase(object):

    @property
    def context(self):
        raise NotImplementedError()

    @property
    def recv_is_supported(self):
        raise NotImplementedError()

    @property
    def emit_is_supported(self):
        raise NotImplementedError()

    def close(self):
        raise NotImplementedError()

    def new_event(self, name, args, xheader=None):
        raise NotImplementedError()

    def emit_event(self, event, timeout=None):
        raise NotImplementedError()

    def emit(self, name, args, xheader=None, timeout=None):
        event = self.new_event(name, args, xheader)
        return self.emit_event(event, timeout)

    def recv(self, timeout=None):
        raise NotImplementedError()
