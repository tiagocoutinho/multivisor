import functools
import hashlib
import json
import re
import fnmatch

from flask import session, abort

_PROTO_RE_STR = '(?P<protocol>\w+)\://'
_HOST_RE_STR = '?P<host>([\w\-_]+\.)*[\w\-_]+|\*'
_PORT_RE_STR = '\:(?P<port>\d{1,5})'

URL_RE = re.compile('({protocol})?({host})?({port})?'.format(protocol=_PROTO_RE_STR,
                                                             host=_HOST_RE_STR,
                                                             port=_PORT_RE_STR))


def sanitize_url(url, protocol=None, host=None, port=None):
    match = URL_RE.match(url)
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


def filter_patterns(names, patterns):
    patterns = ['*:{}'.format(p) if ':' not in p and '*' not in p else p
                for p in patterns]
    result = set()
    sets = (fnmatch.filter(names, pattern) for pattern in patterns)
    list(map(result.update, sets))
    return result


def load_config(config_file):
    parser = SafeConfigParser()
    parser.read(config_file)
    dft_global = dict(name='multivisor')

    supervisors = {}
    config = dict(dft_global, supervisors=supervisors)
    config.update(parser.items('global'))
    tasks = []
    for section in parser.sections():
        if not section.startswith('supervisor:'):
            continue
        name = section[len('supervisor:'):]
        section_items = dict(parser.items(section))
        url = section_items.get('url', '')
        supervisors[name] = Supervisor(name, url)
    return config


def is_login_valid(app, username, password):
    username = username.strip()
    password = password.strip()

    correct_username = app.multivisor.config['username']
    correct_password = app.multivisor.config['password']
    return constant_time_compare(username, correct_username) and constant_time_compare(password, correct_password)


def constant_time_compare(val1, val2):
    """
    Returns True if the two strings are equal, False otherwise.

    The time taken is independent of the number of characters that match.

    For the sake of simplicity, this function executes in constant time only
    when the two strings have the same length. It short-circuits when they
    have different lengths.

    Taken from Django Source Code
    """
    val1 = hashlib.sha1(val1).hexdigest()
    if val2.startswith('{SHA}'):  # password can be specified as SHA-1 hash in config
        val2 = val2.split('{SHA}')[1]
    else:
        val2 = hashlib.sha1(val2).hexdigest()
    if len(val1) != len(val2):
        return False
    result = 0
    for x, y in zip(val1, val2):
        result |= ord(x) ^ ord(y)
    return result == 0


def login_required(app):
    """
    Decorator to mark view as requiring being logged in
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper_login_required(*args, **kwargs):
            auth_on = app.multivisor.use_authentication

            if not auth_on or 'username' in session:
                return func(*args, **kwargs)

            # user not authenticated, return 401
            abort(401)

        return wrapper_login_required
    return decorator


def parse_str(value):
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return value


def parse_dict_str(obj):
    if not isinstance(obj, dict):
        return parse_str(obj)

    return {parse_str(key): parse_str(value) for key, value in obj.items()}
