const Multivisor = {
  data: {
    supervisors: {},
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
    return fetch('/restart_process', {method: 'POST', body: form}).
      then(response => response.json());
  },

  stop_process(process) {
    console.log('stop process ' + process.uid);
    let form = new FormData();
    form.append('uid', process.uid);
    return fetch('/stop_process', {method: 'POST', body: form}).
      then(response => response.json());
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
