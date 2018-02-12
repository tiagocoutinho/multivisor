export const supervisorAction = (id, action) => {
  let form = new FormData()
  form.append('supervisor', id)
  return fetch('/' + action + '_supervisor', {method: 'POST', body: form})
}

export const processAction = (uid, action) => {
  let form = new FormData()
  form.append('uid', uid)
  fetch('/' + action + '_process', { method: 'POST', body: form })
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
    console.log('event ' + data)
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

export const demoMultivisor = {
  name: 'ESRF-ID00',
  supervisors: {
    lid001: {
      name: 'lid001',
      host: 'lid001',
      version: '3.0',
      supervisor_version: '3.3.3',
      running: 'true',
      tags: [],
      port: 9001,
      pid: 34567,
      identification: 'lid001',
      processes: {
        'PLC:WagoA@lid001': { uid: 'PLC:WagoA@lid001', name: 'WagoA', group: 'PLC', supervisor: 'lid001', statename: 'RUNNING' },
        'PLC:WagoB@lid001': { uid: 'PLC:WagoB@lid001', name: 'WagoB', group: 'PLC', supervisor: 'lid001', statename: 'STOPPING' },
        'PLC:WagoC@lid001': { uid: 'PLC:WagoC@lid001', name: 'WagoC', group: 'PLC', supervisor: 'lid001', statename: 'RUNNING' },
        'ser2net@lid001': { uid: 'ser2net@lid001', name: 'ser2net', group: 'Communication', supervisor: 'lid001', statename: 'RUNNING' }
      }
    },
    lid002: {
      name: 'lid002',
      host: 'lid002',
      version: '3.1',
      supervisor_version: '3.4.0',
      running: 'true',
      tags: [],
      port: 9001,
      pid: 569,
      identification: 'lid002',
      processes: {
        'PLC:WagoD@lid002': { uid: 'PLC:WagoD@lid002', name: 'WagoD', group: 'PLC', supervisor: 'lid002', statename: 'RUNNING' },
        'PLC:WagoE@lid002': { uid: 'PLC:WagoE@lid002', name: 'WagoE', group: 'PLC', supervisor: 'lid002', statename: 'RUNNING' },
        'PLC:WagoF@lid002': { uid: 'PLC:WagoF@lid002', name: 'WagoF', group: 'PLC', supervisor: 'lid002', statename: 'RUNNING' },
        'Counter:P201@lid002': { uid: 'Counter:P201@lid002', name: 'P201', group: 'Counter', supervisor: 'lid002', statename: 'RUNNING' },
        'Multiplexer:Opiom@lid002': { uid: 'Multiplexer:Opiom@lid002', name: 'Opiom', group: 'Multiplexer', supervisor: 'lid002', statename: 'RUNNING' },
        'ser2net@lid002': { uid: 'ser2net@lid002', name: 'ser2net', group: 'Communication', supervisor: 'lid002', statename: 'RUNNING' }
      }
    },
    lid00bas1: {
      name: 'lid00bas1',
      host: 'lid00bas1',
      version: '3.1',
      supervisor_version: '3.4.0',
      running: 'true',
      tags: [],
      port: 9001,
      pid: 22456,
      identification: 'lid00bas1',
      processes: {
        'BeamViewer:wbv1@lid00bas1': { uid: 'BeamViewer:wbv1@lid00bas1', name: 'wbv1', group: 'BeamViewer', supervisor: 'lid00bas1', statename: 'RUNNING' },
        'BeamViewer:wbv2@lid00bas1': { uid: 'BeamViewer:wbv2@lid00bas1', name: 'wbv2', group: 'BeamViewer', supervisor: 'lid00bas1', statename: 'STOPPED' },
        'BeamViewer:mbv1@lid00bas1': { uid: 'BeamViewer:mbv1@lid00bas1', name: 'mbv1', group: 'BeamViewer', supervisor: 'lid00bas1', statename: 'FATAL' }
      }
    }
  }
}
