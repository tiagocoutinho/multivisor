import {Notification} from 'element-ui'

const LOG_LEVEL = {
  'DEBUG': 'info',
  'INFO': 'info',
  'WARNING': 'warning',
  'ERROR': 'error',
}

const to_lower = text => {
  return text.toString().toLowerCase()
}

const supervisor_action = (id, action) => {
  let form = new FormData();
  form.append('supervisor', id);
  return fetch('/' + action + '_supervisor', {method: 'POST', body: form});
}

const Multivisor = {
  data: {
    supervisors: {},
  },
  log: '',

  stream_to(vue) {
    let multivisor = vue.multivisor;
    let event_source = new EventSource('/stream');
    console.log('subscribing to stream...');

    event_source.onmessage = event => {
      let data = JSON.parse(event.data);
      if(data.event === 'supervisor_changed') {
        let supervisor = data.payload;
        multivisor.data.supervisors[supervisor.name] = supervisor;
      }
      else if (data.event == 'process_changed') {
        let process = data.payload;
        let supervisor = multivisor.data.supervisors[process.supervisor];
        supervisor.processes[process.uid] = process;
      }
      else if (data.event == 'log') {
        let log = data.payload;
        multivisor.log = log;
        // the following should be moved to a vue event listener
        Notification({
          title: log.message,
          message: Date(log.time*1000),
          type: LOG_LEVEL[log.level],
          position: 'bottom-right',
        });
        //console.log('server log:' + data.payload.message);
      }
      else {
        console.warn('unknnown event');
        console.log(event);
      }
    };

    event_source.onopen = event => {
      console.log('stream open');
    };

    event_source.onerror = event => {
      console.log('stream closed');
    };
  },

  get () {
    return fetch('/data')
      .then(response => response.json());
  },

  refresh () {
    return fetch('/refresh')
      .then(response => response.json());
  },

  supervisor_action(id, action) {
    let form = new FormData();
    form.append('supervisor', id);
    return fetch('/' + action + '_supervisor', {method: 'POST', body: form});
  },

  update_supervisor(id) {
    return supervisor_action(id, 'update')
  },

  restart_supervisor(id) {
    return supervisor_action(id, 'restart')
  },

  reread_supervisor(id) {
    return supervisor_action(id, 'reread')
  },

  shutdown_supervisor(id) {
    return supervisor_action(id, 'shutdown')
  },

  restart_process(uid) {
    let form = new FormData();
    form.append('uid', uid);
    fetch('/restart_process', {method: 'POST', body: form});
  },

  stop_process(uid) {
    let form = new FormData();
    form.append('uid', uid);
    fetch('/stop_process', {method: 'POST', body: form});
  },

  restart_processes(processes) {
    let form = new FormData();
    let uids = processes.map(process => process.uid);
    form.append('uid', uids);
    fetch('/restart_process', {method: 'POST', body: form});
  },

  stop_processes(processes) {
    let form = new FormData();
    let uids = processes.map(process => process.uid);
    form.append('uid', uids);
    fetch('/stop_process', {method: 'POST', body: form});
  },

  process_info(process) {
    return fetch('/process/' + process.uid)
      .then(response => response.json());
  },

  process_string(process) {
    var result = '';
    for(let key in process) {
      result += key + ' = ' + process[key] + '\n';
    }
    return result;
  },

  get_processes(multivisor, supervisor) {
    let processes = [];
    let supervisors = [supervisor];
    if (supervisor === undefined) {
      supervisors = multivisor.data.supervisors;
    }
    for(let sname in supervisors) {
      let supervisor = supervisors[sname];
      for(let pname in supervisor.processes) {
        let process = supervisor.processes[pname];
        processes.push(process);
      }
    }
    return processes;
  },

  get_filtered_processes(multivisor, term, supervisor) {
    let processes = [];
    let supervisors = [supervisor];
    let lterm = term ? to_lower(term): "";
    if (supervisor === undefined) {
      supervisors = multivisor.data.supervisors;
    }
    for(let sname in supervisors) {
      let supervisor = supervisors[sname];
      for(let pname in supervisor.processes) {
        let process = supervisor.processes[pname];
        if(!term ||
           to_lower(process.name).includes(lterm) ||
           to_lower(process.group).includes(lterm) ||
           to_lower(process.supervisor).includes(lterm) ||
           to_lower(process.statename).includes(lterm)) {
          processes.push(process);
        }
      }
    }
    return processes;
  },

};

Multivisor.install = function (Vue, options) {
  Vue.multivisor = Multivisor;
}

export default Multivisor;
