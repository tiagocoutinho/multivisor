<template>
<div>
  <el-table border :data="processes" style="width: 100%"
            :max-height="table_height"
            @selection-change="selected_processes_changed"
            :default-sort="{prop: 'supervisor', order: 'ascending'}"
            >
    <el-table-column type="expand">
      <template slot-scope="props">
        <ProcessDetails :process="props.row"></ProcessDetails>
      </template>
    </el-table-column>
    <el-table-column type="selection"></el-table-column>
    <el-table-column prop="name" label="Name" sortable></el-table-column>
    <el-table-column prop="group" label="Group" sortable show-overflow-tooltip></el-table-column>
    <el-table-column prop="supervisor" label="Supervisor" sortable show-overflow-tooltip></el-table-column>
    <el-table-column label="Status" sortable>
      <template slot-scope="scope">
        <el-tag :type="state_to_tag[scope.row.statename]" size="small">
          {{scope.row.statename}}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="Actions" min-width="180">
      <template slot-scope="scope">
        <el-button @click="restart_process(scope.row)">(Re)Start</el-button>
        <el-button :disabled="!scope.row.running"
                   @click="stop_process(scope.row)">Stop</el-button>
        <el-button @click="log(scope.row)">Log</el-button>
      </template>
    </el-table-column>
  </el-table>
  <div>
    <el-button>Restart selected</el-button>
    <el-button>Stop selected</el-button>
  </div>
</div>
</template>

<script>
import ProcessDetails from './ProcessDetails'

export default {
  name: 'ProcessTable',
  props: ['multivisor'],

  components: {
    ProcessDetails
  },

  data() {
    return {
      state_to_tag: {
        'STOPPED': '',
        'STARTING': 'primary',
        'RUNNING': 'success',
        'BACKOFF': 'warning',
        'STOPPING': 'primary',
        'EXITED': 'warning',
        'FATAL': 'danger',
        'UNKNOWN': 'info'
      },
      table_height: Math.max(100, window.innerHeight - 80),
      selected_processes: {}
    }
  },

  mounted: function() {
    window.addEventListener('resize', this.handle_resize);
  },

  beforeDestroy: function () {
    window.removeEventListener('resize', this.handle_resize);
  },

  methods: {
    process_status_class({row, rowIndex}){
      return row.statename.toLowerCase();
    },
    get_supervisor(name) {
      return this.multivisor.data.supervisors[name];
    },
    restart_process(process) {
      var supervisor = this.get_supervisor(process.supervisor);
      this.multivisor.restart_process(process);
    },
    stop_process(process) {
      var supervisor = this.get_supervisor(process.supervisor);
      this.multivisor.stop_process(process);
    },
    process_info(process) {
      var multivisor = this.multivisor;
      var supervisor = this.get_supervisor(process.supervisor);
      multivisor.process_info(process)
        .then(function(updated_process) {
          alert(multivisor.process_string(updated_process));
        });
    },
    get_process_info(process) {
      return this.multivisor.process_string(process);
    },
    restart_selected() {
      alert(Object.keys(this.selected_processes));
    },
    handle_resize(event) {
      this.table_heigth = Math.max(100, event.currentTarget.innerHeight - 80);
    }
  },
  computed: {
    processes() {
      return this.multivisor.get_processes(this.multivisor);
    },
  }
}
</script>
