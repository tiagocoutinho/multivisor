import re
import fnmatch


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


def filter_patterns(names, patterns):
    patterns = ['*:{}'.format(p) if ':' not in p and '*' not in p else p
                for p in patterns]
    result = set()
    sets = (fnmatch.filter(names, pattern) for pattern in patterns)
    map(result.update, sets)
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

