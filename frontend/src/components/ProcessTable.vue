<template>
<el-row>
  <el-row>
    <el-col :span="16">
      <el-button :disabled="!selected_processes.length"
                 @click="restart_selected()">Restart selected
      </el-button>
      <el-button :disabled="!selected_processes.length"
                 @click="stop_selected()">Stop selected
      </el-button>
    </el-col>
    <el-col :span="8">
      <el-input placeholder="Filter..." v-model="search" clearable>
      </el-input>
    </el-col>
  </el-row>
  <el-row>
  <el-table border :data="processes" style="width: 100%"
            :max-height="800"
            @selection-change="selected_processes_changed"
            :default-sort="{prop: 'supervisor', order: 'ascending'}">
    <el-table-column type="expand">
      <template slot-scope="props">
        <ProcessDetails :process="props.row"></ProcessDetails>
      </template>
    </el-table-column>
    <el-table-column type="selection"></el-table-column>
    <el-table-column prop="name" label="Name" sortable>
    </el-table-column>
    <el-table-column prop="group" label="Group" sortable show-overflow-tooltip></el-table-column>
    <el-table-column prop="supervisor" label="Supervisor" sortable show-overflow-tooltip></el-table-column>
    <el-table-column label="Status" sortable>
      <template slot-scope="scope">
        <el-tag :type="state_to_tag[scope.row.statename]">
          {{scope.row.statename}}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="Actions">
      <template slot-scope="scope">
        <el-tooltip class="item" content="Restart/Stop/Log">
          <el-button-group>
            <el-button @click="restart_process(scope.row)" icon="el-icon-refresh">
              </el-button>
            <el-button :disabled="!scope.row.running"
                       @click="stop_process(scope.row)"
                       icon="el-icon-close">
            </el-button>
            <el-button @click="log(scope.row)" icon="el-icon-tickets">
            </el-button>
          </el-button-group>
        </el-tooltip>
      </template>
    </el-table-column>
  </el-table>
  </el-row>
<el-row>
</template>

<script>
import ProcessDetails from './ProcessDetails'
import { MessageBox } from 'element-ui'
export default {
  name: 'ProcessTable',
  props: ['multivisor'],

  components: {
    ProcessDetails
  },

  data() {
    return {
      state_to_tag: {
        'STOPPED': 'info',
        'STARTING': 'primary',
        'RUNNING': 'success',
        'BACKOFF': 'warning',
        'STOPPING': 'primary',
        'EXITED': 'warning',
        'FATAL': 'danger',
        'UNKNOWN': 'info'
      },
      selected_processes: [],
      search: null,
    }
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
      let processes = this.selected_processes.slice();
      MessageBox.confirm('Are you sure you want to restart these processes?',
                         'Question',
                         { type: 'warning',
                           confirmButtonText: 'YES',
                           cancelButtonText: 'No',
                           center: true }).then(() => {
          this.multivisor.restart_processes(processes);
          this.selected_processes = [];
      });
    },
    stop_selected() {
      let processes = this.selected_processes.slice();
      MessageBox.confirm('Are you sure you want to restart these processes?',
                         'Question',
                         { type: 'warning',
                           confirmButtonText: 'YES',
                           cancelButtonText: 'No',
                           center: true }).then(() => {
        this.multivisor.stop_processes(processes);
        this.selected_processes = [];
      });

    },
    selected_processes_changed(val) {
      this.selected_processes = val;
    }
  },
  computed: {
    processes() {
      return this.multivisor.get_filtered_processes(this.multivisor, this.search);
    },
  }
}
</script>
