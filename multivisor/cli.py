from __future__ import print_function
from __future__ import unicode_literals

import re
import fnmatch

import colorful

from prompt_toolkit import prompt
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.completion import Completer, Completion
from prompt_toolkit.contrib.completers import WordCompleter
from prompt_toolkit.validation import ValidationError
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory

from .client import Multivisor, processes_status

STYLE = {
    'STOPPED': colorful.red,
    'STARTING': colorful.blue,
    'RUNNING': colorful.green,
    'BACKOFF': colorful.orange,
    'STOPPING': colorful.blue,
    'EXITED': colorful.red,
    'FATAL': colorful.purple,
    'UNKNOWN': colorful.grey
}


def sanitize_url(url, protocol=None, host=None, port=None):
    match = re.match('((?P<protocol>\w+)\://)?(?P<host>\w+)?(\:(?P<port>\d+))?', url)
    if match is None:
        raise ValueError('Invalid URL: {!r}'.format(url))
    pars = match.groupdict()
    _protocol, _host, _port = pars['protocol'], pars['host'], pars['port']
    protocol = protocol if _protocol is None else _protocol
    host = host if _host is None else _host
    port = port if _port is None else _port
    protocol = '' if protocol is None else (protocol + '://')
    port = '' if port is None else ':' + str(port)
    return dict(url='{}{}{}'.format(protocol, host, port),
                protocol=protocol, host=host, port=port)


def console_status(status, group_by='group', filter='*'):
    filt = lambda p: fnmatch.fnmatch(p['uid'], filter)
    status_str = '\n'.join(processes_status(status, group_by=group_by, filter=filt))
    for key, color in STYLE.items():
        status_str = status_str.replace(key, str(color(key)))
    return status_str


class CLI(object):

    def __init__(self, url):
        self.multivisor = Multivisor(url)

    def status_cmd(self, *args):
        status = self.multivisor.get_status()
        kwargs = {}
        if args:
            kwargs['filter'] = args[0]
        print(console_status(status, **kwargs))
        return status

    def restart_cmd(self, *args):
        if not args:
            raise ValidationError(message='Need at least one process')
        self.multivisor.restart_processes(*args)

    def stop_cmd(self, *args):
        if not args:
            raise ValidationError(message='Need at least one process')
        self.multivisor.stop_processes(*args)

    def help_cmd(self, *args):
        pass

    def find_command(self, name):
        try:
            return getattr(self, name + '_cmd')
        except AttributeError:
            raise ValidationError(message="Unknown command '{}'".format(name))

    def parse_command_line(self, text):
        args = text.split()
        cmd = self.find_command(args[0])
        return cmd, args[1:]

    def run_command_line(self, text):
        try:
            cmd, args = self.parse_command_line(text)
            cmd(*args)
        except KeyboardInterrupt:
            raise
        except Exception as err:
            print(colorful.red('Error: '), err)

    def run(self):
        initial_status = self.status_cmd()
        history = InMemoryHistory()
        auto_suggest = AutoSuggestFromHistory()
        words = list(initial_status['processes'].keys())
        words.extend((meth[:-4] for meth in dir(self) if meth.endswith('_cmd')))
        completer = WordCompleter(words)
        prmpt = 'multivisor[{}]> '.format(initial_status['name'])
        while True:
            try:
                text = prompt(prmpt, history=history, completer=completer,
                              auto_suggest=auto_suggest)
                if not text:
                    text = 'status'
                self.run_command_line(text)
            except KeyboardInterrupt:
                continue
            except EOFError:
                break


def main(args=None):
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', help='[http://]<host>[:<22000>]',
                        default='localhost:22000')
    options = parser.parse_args(args)
    url = sanitize_url(options.url, protocol='http', port=22000)['url']
    cli = CLI(url)
    cli.run()


if __name__ == '__main__':
    main()
