from __future__ import absolute_import

import argparse

from .. import util
from . import repl, http


def parse_args(args=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', help='[http://]<host>[:<22000>]',
                        default='localhost:22000')
    return parser.parse_args(args)


def main(args=None):
    import gevent.monkey
    gevent.monkey.patch_all(thread=False)

    options = parse_args(args)
    url = util.sanitize_url(options.url, protocol='http', port=22000)['url']
    multivisor = http.Multivisor(url)
    cli = repl.Repl(multivisor)
    gevent.spawn(multivisor.run)
    cli.run()


if __name__ == '__main__':
    main()
