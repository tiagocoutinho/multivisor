import re
import fnmatch

try:
    from collections import abc
except ImportError:
    import collections as abc

import arrow
import six


_PROTO_RE_STR = "(?P<protocol>\w+)\://"
_HOST_RE_STR = "?P<host>([\w\-_]+\.)*[\w\-_]+|\*"
_PORT_RE_STR = "\:(?P<port>\d{1,5})"

URL_RE = re.compile(
    "({protocol})?({host})?({port})?".format(
        protocol=_PROTO_RE_STR, host=_HOST_RE_STR, port=_PORT_RE_STR
    )
)


def sanitize_url(url, protocol=None, host=None, port=None):
    match = URL_RE.match(url)
    if match is None:
        raise ValueError("Invalid URL: {!r}".format(url))
    pars = match.groupdict()
    _protocol, _host, _port = pars["protocol"], pars["host"], pars["port"]
    protocol = protocol if _protocol is None else _protocol
    host = host if _host is None else _host
    port = port if _port is None else _port
    protocol = "" if protocol is None else (protocol + "://")
    port = "" if port is None else ":" + str(port)
    return dict(
        url="{}{}{}".format(protocol, host, port),
        protocol=protocol,
        host=host,
        port=port,
    )


def filter_patterns(names, patterns):
    patterns = [
        "*:{}".format(p) if ":" not in p and "*" not in p else p for p in patterns
    ]
    result = set()
    sets = (fnmatch.filter(names, pattern) for pattern in patterns)
    result.update(*sets)
    return result


def parse_dict(obj):
    """Returns a copy of `obj` where bytes from key/values was replaced by str"""
    decoded = {}
    for k, v in obj.items():
        if isinstance(k, bytes):
            k = k.decode("utf-8")
        if isinstance(v, bytes):
            v = v.decode("utf-8")
        decoded[k] = v
    return decoded


def parse_obj(obj):
    """Returns `obj` or a copy replacing recursively bytes by str

    `obj` can be any objects, including list and dictionary"""
    if isinstance(obj, bytes):
        return obj.decode()
    elif isinstance(obj, six.text_type):
        return obj
    elif isinstance(obj, abc.Mapping):
        return {parse_obj(k): parse_obj(v) for k, v in obj.items()}
    elif isinstance(obj, abc.Container):
        return type(obj)(parse_obj(i) for i in obj)
    return obj


def human_time(ts=None):
    if ts is None:
        dt = arrow.now()
    elif not ts:
        return "Never"
    else:
        dt = arrow.get(ts)
    return f"{dt} ({dt.humanize()})"


def delta_human_time(ts=None):
    if ts is None:
        dt = arrow.now()
    elif not ts:
        return "Never"
    else:
        dt = arrow.get(ts)
    return dt.humanize()
