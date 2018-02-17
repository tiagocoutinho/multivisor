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
  console.log('subscribing to stream...')

  eventSource.onmessage = event => {
    let data = JSON.parse(event.data)
    eventHandler(data)
  }

  eventSource.onopen = event => {
    console.log('stream opened')
  }

  eventSource.onerror = event => {
    console.log('stream closed')
  }
}

export const nullMultivisor = {
  name: 'Multivisor',
  supervisors: {}
}
