import fnmatch
import re

_PROTO_RE_STR = r'(?P<protocol>\w+)\://'
_HOST_RE_STR = r'?P<host>([\w\-_]+\.)*[\w\-_]+|\*'
_PORT_RE_STR = r'\:(?P<port>\d{1,5})'

URL_RE = re.compile(
    '({protocol})?({host})?({port})?'.format(
        protocol=_PROTO_RE_STR,
        host=_HOST_RE_STR,
        port=_PORT_RE_STR
    )
)


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
    map(result.update, sets)
    return result
