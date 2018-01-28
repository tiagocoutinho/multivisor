const Multivisor = {
  data: {
    supervisors: {},
  },
  log: '',

  stream_to(multivisor) {
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
        multivisor.log = data.payload;
        console.log('log:' + data.payload.message);
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

  restart_process(process) {
    console.log('(re)start process ' + process.uid);
    let form = new FormData();
    form.append('uid', process.uid);
    fetch('/restart_process', {method: 'POST', body: form});
  },

  stop_process(process) {
    console.log('stop process ' + process.uid);
    let form = new FormData();
    form.append('uid', process.uid);
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

  get_processes(multivisor) {
    let processes = [];
    let supervisors = multivisor.data.supervisors;
    for(let sname in supervisors) {
      let supervisor = supervisors[sname];
      for(let pname in supervisor.processes) {
        let process = supervisor.processes[pname];
        processes.push(process);
      }
    }
    return processes;
  },

};

Multivisor.install = function (Vue, options) {
  Vue.multivisor = Multivisor;
}

export default Multivisor;
