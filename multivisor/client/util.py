import collections


def group_processes_status_by(processes, group_by='group', process_filter=None):
    result = collections.defaultdict(lambda: dict(processes={}))
    if process_filter is None:
        process_filter = lambda p: True
    for uid, process in processes.items():
        if not process_filter(process):
            continue
        name = process[group_by]
        order = result[name]
        order['name'] = name
        order['processes'][uid] = process
    return result


def default_process_status(process, max_puid_len=10, group_by='group'):
    nuid = '{{uid:{}}}'.format(max_puid_len).format(uid=process['uid'])
    if group_by in (None, 'process'):
        template = '{nuid} {statename:8} {description}'
    else:
        template = '  {nuid} {statename:8} {description}'
    return template.format(nuid=nuid, **process)


def processes_status(status, group_by='process', process_filter=None,
                     process_status=default_process_status):
    processes = status['processes']
    if processes:
        puid_len = max(map(len, processes))
    else:
        puid_len = 8
    result = []
    if process_filter is None:
        process_filter = lambda p: True
    if group_by in (None, 'process'):
        for puid in sorted(processes):
            process = processes[puid]
            if process_filter(process):
                result.append(process_status(process, max_puid_len=puid_len,
                                             group_by=group_by))
    else:
        grouped = group_processes_status_by(processes, group_by=group_by,
                                            process_filter=process_filter)
        for name in sorted(grouped):
            result.append(name + ':')
            for process in grouped[name]['processes'].values():
                result.append(process_status(process, max_puid_len=puid_len,
                                             group_by=group_by))
    return result
