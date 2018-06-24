from __future__ import print_function
from __future__ import unicode_literals

import re
import fnmatch
import datetime
import functools

import maya
import louie
from prompt_toolkit import PromptSession, HTML, print_formatted_text
from prompt_toolkit.styles import Style
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.validation import ValidationError
from prompt_toolkit.application import run_in_terminal
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory

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

NOTIF_STYLE = {
  'DEBUG': 'grey',
  'INFO': 'blue',
  'WARNING': 'orange',
  'ERROR': 'red'
}

def process_description(process):
    # TODO
    status = process['statename']
    if status == 'FATAL':
        return process['description']
    elif process['running']:
        start = maya.MayaDT(process['start'])
        desc = 'pid {pid}, started {start} ({delta})' \
               .format(pid=process['pid'], start=start.rfc2822(), delta=start.slang_time())
    else:
        stop = maya.MayaDT(process['stop'])
        desc = 'stopped on {stop} ({delta} ago)' \
               .format(stop=stop.rfc2822(), delta=stop.slang_time())
    return desc


def process_status(process, max_puid_len=10, group_by='group'):
    state = process['statename']
    uid = '{{uid:{}}}'.format(max_puid_len).format(uid=process['uid'])
    desc = process_description(process)
    text = '{p}{uid} <{lstate}>{state:8}</{lstate}> {description}' \
           .format(p=('' if group_by in (None, 'process') else '  '),
                   uid=uid, state=state, lstate=state.lower(),
                   description=desc)
    return HTML(text)


def processes_status(status, group_by='group', filter='*'):
    filt = lambda p: fnmatch.fnmatch(p['uid'], filter)
    return util.processes_status(status, group_by=group_by, filter=filt,
                                 process_status=process_status)


def print_processes_status(status, *args):
    kwargs = {}
    if args:
        kwargs['filter'] = args[0]
    for text in processes_status(status, **kwargs):
        print_formatted_text(text, style=STYLE)


def cmd(f=None, name=None):
    if f is None:
        return functools.partial(cmd, name=name)
    f.__cmd__ = (name or f.__name__).decode()
    return f


class Commands(object):
    def __init__(self, multivisor):
        self.multivisor = multivisor

    @cmd(name='refresh-status')
    def refresh_status(self):
        """
        refresh              Refresh status (eq of Ctrl+F5 in browser)
        """
        print_processes_status(self.multivisor.refresh_status())

    @cmd
    def status(self, *args):
        """
        status               Status of all processes
        status <pattern>     Status of a pattern of processes
        """
        print_processes_status(self.multivisor.status, *args)

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
        result = {}
        for name in dir(cls):
            member = getattr(cls, name)
            cmd = getattr(member, '__cmd__', None)
            if cmd:
                result[cmd] = name
        return result

    def get_command(self, name):
        method_name = self.get_commands().get(name)
        if method_name is None:
            raise ValidationError(message="Unknown command '{}'".format(name))
        return getattr(self, method_name)


def Prompt(**kwargs):
    history = InMemoryHistory()
    auto_suggest = AutoSuggestFromHistory()
    prmpt = 'multivisor> '
    return PromptSession(prmpt, history=history, auto_suggest=auto_suggest,
                         **kwargs)


class Repl(object):

    keys = KeyBindings()

    def __init__(self, multivisor):
        self.multivisor = multivisor
        self.commands = Commands(multivisor)
        status = self.multivisor.status
        words = list(status['processes'].keys())
        words.extend(self.commands.get_commands())
        completer = WordCompleter(words)
        self.session = Prompt(completer=completer, bottom_toolbar=self.toolbar,
                              key_bindings=self.keys)
        self.session.app.commands = self.commands
        self.__update_toolbar()
        louie.connect(self.__update_toolbar, sender=self.multivisor)

    def __update_toolbar(self):
        status = self.multivisor.status
        stats = status['stats']
        s_stats, p_stats = stats['supervisors'], stats['processes']
        notifications = self.multivisor.notifications
        if notifications:
            notif = notifications[-1]
        else:
            notif = dict(level='INFO', message='Welcome to multivisor CLI')
        html = '{name} | Supervisors: {s[total]} (' \
               '<b><style bg="green">{s[running]}</style></b>/' \
               '<b><style bg="red">{s[stopped]}</style></b>) ' \
               '| Processes: {p[total]} (' \
               '<b><style bg="green">{p[running]}</style></b>/' \
               '<b><style bg="red">{p[stopped]}</style></b>) ' \
               '| <style bg="{notif_color}">{notif_msg}</style>' \
               .format(name=status['name'], s=s_stats, p=p_stats,
                       notif_color=NOTIF_STYLE[notif['level']],
                       notif_msg=notif['message'])
        self.__toolbar = HTML(html)
        self.session.app.invalidate()

    @keys.add('f5')
    def __on_refresh(event):
        run_in_terminal(event.app.commands.refresh_status())

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

    def toolbar(self):
        return self.__toolbar

    def run(self):
        self.commands.status()
        while True:
            try:
                text = self.session.prompt()
                if not text:
                    continue
                self.run_command_line(text)
            except KeyboardInterrupt:
                continue
            except EOFError:
                break

