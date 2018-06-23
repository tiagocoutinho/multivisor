from __future__ import print_function
from __future__ import unicode_literals

import re
import fnmatch

from prompt_toolkit import prompt
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.validation import ValidationError
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit import print_formatted_text, HTML
from prompt_toolkit.styles import Style

from . import util


STYLE = Style.from_dict({
    'stopped': 'ansired',
    'starting': 'ansiblue',
    'running': 'ansigreen',
    'backoff': 'orange',
    'stopping': 'ansiblue',
    'exited': 'ansired bold',
    'fatal': 'violet',
    'unknown': 'grey',
})


def process_status(process, max_puid_len=10, group_by='group'):
    state = process['statename']
    uid = '{{uid:{}}}'.format(max_puid_len).format(uid=process['uid'])
    text = '{p}{uid} <{lstate}>{state:8}</{lstate}> {description}' \
           .format(p=('' if group_by in (None, 'process') else '  '),
                   uid=uid, state=state, lstate=state.lower(),
                   description=process['description'])
    return HTML(text)


def processes_status(status, group_by='group', filter='*'):
    filt = lambda p: fnmatch.fnmatch(p['uid'], filter)
    return util.processes_status(status, group_by=group_by, filter=filt,
                                 process_status=process_status)


def cmd(f):
    f.__cmd__ = True
    return f


class Commands(object):
    def __init__(self, multivisor):
        self.multivisor = multivisor

    @cmd
    def status(self, *args):
        """
        status               Status of all processes
        status <pattern>     Status of a pattern of processes
        """
        status = self.multivisor.get_status()
        kwargs = {}
        if args:
            kwargs['filter'] = args[0]
        for text in processes_status(status, **kwargs):
            print_formatted_text(text, style=STYLE)
        return status

    @cmd
    def restart(self, *args):
        """
        restart <pattern> <pattern>*    Restart a list of process patterns
        """
        if not args:
            raise ValidationError(message='Need at least one process')
        self.multivisor.restart_processes(*args)

    @cmd
    def stop(self, *args):
        """
        stop <pattern> <pattern>*    Stop a list of process patterns
        """
        if not args:
            raise ValidationError(message='Need at least one process')
        self.multivisor.stop_processes(*args)

    @cmd
    def help(self, *args):
        """
        Available commands (type help <topic>):
        =======================================

        {cmds}
        """
        if not args:
            args = 'help',
        cmd = self.get_command(args[0])
        cmds = '  '.join(self.get_commands())
        raw_text = cmd.__doc__.format(cmds=cmds)
        text = '\n'.join(map(unicode.strip, raw_text.split('\n')))
        print_formatted_text(text)

    @classmethod
    def get_commands(cls):
        return [meth.decode() for meth in dir(cls)
                if getattr(getattr(cls, meth), '__cmd__', False)]

    def get_command(self, name):
        try:
            cmd = getattr(self, name)
            cmd.__cmd__
            return cmd
        except AttributeError:
            raise ValidationError(message="Unknown command '{}'".format(name))


class Repl(object):

    def __init__(self, commands):
        self.commands = commands

    def parse_command_line(self, text):
        args = text.split()
        cmd = self.commands.get_command(args[0])
        return cmd, args[1:]

    def run_command_line(self, text):
        try:
            cmd, args = self.parse_command_line(text)
            cmd(*args)
        except KeyboardInterrupt:
            raise
        except Exception as err:
            print_formatted_text(HTML('<red>Error:</red> {}'.format(err)))

    def run(self):
        initial_status = self.commands.status()
        history = InMemoryHistory()
        auto_suggest = AutoSuggestFromHistory()
        words = list(initial_status['processes'].keys())
        words.extend(self.commands.get_commands())
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

