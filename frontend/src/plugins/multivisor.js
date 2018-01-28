const Multivisor = {

  get () {
    return fetch('/data')
      .then(response => response.json());
  },

  restart_process(process) {
    let name = process.group + ':' + process.name + '@' + process.supervisor;
    console.log('(re)start process ' + name);
    let form = new FormData();
    form.append('supervisor', process.supervisor);
    form.append('name', process.name);
    return fetch('/restart_process', {method: 'POST', body: form}).
      then(response => response.json());
  },

  stop_process(process) {
    let name = process.group + ':' + process.name + '@' + process.supervisor;
    console.log('stop process ' + name);
    let form = new FormData();
    form.append('supervisor', process.supervisor);
    form.append('name', process.name);
    return fetch('/stop_process', {method: 'POST', body: form}).
      then(response => response.json());
  },

  process_info(process) {
    return fetch('/process/' + process.supervisor + '/' + process.name)
      .then(response => response.json());
  }
};

Multivisor.install = function (Vue, options) {
  Vue.multivisor = Multivisor;
}

export default Multivisor;
