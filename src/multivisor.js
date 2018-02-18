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

export const nullMultivisor = {
  name: 'Multivisor',
  supervisors: {}
}
