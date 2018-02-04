export const dateString = (value) => {
  const date = new Date(value)
  return date.toString()
}

export const longAgo = (timestamp) => {
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
