# Vendored from zerorpc-python, see LICENSE in this directory.

import inspect

from .patterns import ReqRep, ReqStream


class DecoratorBase(object):
    pattern = None

    def __init__(self, functor):
        self._functor = functor
        self.__doc__ = functor.__doc__
        self.__name__ = getattr(functor, "__name__", str(functor))

    def __get__(self, instance, type_instance=None):
        if instance is None:
            return self
        return self.__class__(self._functor.__get__(instance, type_instance))

    def __call__(self, *args, **kargs):
        return self._functor(*args, **kargs)

    def _zerorpc_doc(self):
        if self.__doc__ is None:
            return None
        return inspect.cleandoc(self.__doc__)

    def _zerorpc_args(self):
        try:
            args_spec = self._functor._zerorpc_args()
        except AttributeError:
            try:
                args_spec = inspect.getfullargspec(self._functor)
            except TypeError:
                try:
                    args_spec = inspect.getfullargspec(self._functor.__call__)
                except (AttributeError, TypeError):
                    args_spec = None
        return args_spec


class rep(DecoratorBase):
    pattern = ReqRep()


class stream(DecoratorBase):
    pattern = ReqStream()
