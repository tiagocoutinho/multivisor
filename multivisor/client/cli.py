import argparse

import gevent.monkey
gevent.monkey.patch_all(thread=False)

from ..util import sanitize_url
from .repl import Repl, Commands
from .http import Multivisor


def parse_args(args=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', help='[http://]<host>[:<22000>]',
                        default='localhost:22000')
    return parser.parse_args(args)



def main(args=None):
    options = parse_args(args)
    url = sanitize_url(options.url, protocol='http', port=22000)['url']
    multivisor = Multivisor(url)
    commands = Commands(multivisor)
    repl = Repl(commands)
    repl.run()


if __name__ == '__main__':
    main()
