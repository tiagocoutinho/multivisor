export const stateColorMap = {
  STOPPED: 'red',
  STARTING: 'blue',
  RUNNING: 'green',
  BACKOFF: 'orange',
  STOPPING: 'blue',
  EXITED: 'red',
  FATAL: 'purple',
  UNKNOWN: 'grey'
}

export const notificationColorMap = {
  DEBUG: 'grey darken-2',
  INFO: 'grey darken-3',
  WARNING: 'orange',
  ERROR: 'error'
}

export const supervisorAction = (id, action) => {
  let form = new FormData()
  form.append('supervisor', id)
  return fetch('/supervisor/' + action, {method: 'POST', body: form})
}

export const processAction = (uid, action) => {
  let form = new FormData()
  form.append('uid', uid)
  fetch('/process/' + action, { method: 'POST', body: form })
}

export const load = () => {
  return fetch('data')
    .then(response => response.json())
}

export const streamTo = (eventHandler) => {
  let eventSource = new EventSource('/stream')
  eventSource.onmessage = event => {
    let data = JSON.parse(event.data)
    eventHandler(data)
  }
  return eventSource
}

export const formatBytes = (bytes, decimals) => {
  if (bytes === 0) return '0 b'
  let k = 1024
  let dm = decimals || 2
  let sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb']
  let i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const timeAgo = (timestamp) => {
  var templates = {
    prefix: '',
    suffix: ' ago',
    seconds: 'less than a minute',
    minute: 'about a minute',
    minutes: '%d minutes',
    hour: 'about an hour',
    hours: 'about %d hours',
    day: 'a day',
    days: '%d days',
    month: 'about a month',
    months: '%d months',
    year: 'about a year',
    years: '%d years'
  }

  var template = function (t, n) {
    return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)))
  }

  var then = new Date(timestamp * 1000)

  var now = new Date()
  var seconds = ((now.getTime() - then) * 0.001) >> 0
  var minutes = seconds / 60
  var hours = minutes / 60
  var days = hours / 24
  var years = days / 365

  return templates.prefix + (
    (seconds < 45 && template('seconds', seconds)) ||
    (seconds < 90 && template('minute', 1)) ||
    (minutes < 45 && template('minutes', minutes)) ||
    (minutes < 90 && template('hour', 1)) ||
    (hours < 24 && template('hours', hours)) ||
    (hours < 42 && template('day', 1)) ||
    (days < 30 && template('days', days)) ||
    (days < 45 && template('month', 1)) ||
    (days < 365 && template('months', days / 30)) ||
    (years < 1.5 && template('year', 1)) ||
    template('years', years)
    ) + templates.suffix
}

export const nullMultivisor = {
  name: 'Multivisor',
  supervisors: {}
}

export const nullProcess = {
  name: '',
  uid: '',
  pid: 0,
  description: '',
  exitstatus: 0,
  logfile: null,
  stderr_logfile: null,
  start: 0,
  now: 0
}
