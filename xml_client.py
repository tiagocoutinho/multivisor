from gevent.monkey import patch_all
patch_all(thread=False)

from xmlrpclib import ServerProxy

from gevent.lock import RLock


class Wrap(object):

    def __init__(self, lock, method):
        self.lock = lock
        self.method = method

    def __getattr__(self, name):
        return Wrap(self.lock, getattr(self.method, name))

    def __call__(self, *args):
        with self.lock:
            return self.method(*args)


class GServerProxy(ServerProxy):

    def __init__(self, *args, **kwargs):
        self.__lock = RLock()
        ServerProxy.__init__(self, *args, **kwargs)

    def __getattr__(self, name):
        r = ServerProxy.__getattr__(self, name)
        return Wrap(self.__lock, r)



import gevent

proxy = GServerProxy('http://localhost:8000')

def is_even(proxy, number):
    result = proxy.toto.is_even(number)
    print('Is {0} even? {1}'.format(number, result))

def loop(nap=0.1):
    n = 0
    while True:
        gevent.sleep(nap)
        print('Nap {0}'.format(n))
        n += 1

task0 = gevent.spawn(loop)
task1 = gevent.spawn(is_even, proxy, 55)
task2 = gevent.spawn(is_even, proxy, 44)

gevent.joinall((task1, task2))
task0.kill()
