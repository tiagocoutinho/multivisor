<template>
<el-row>
  <el-row :gutter="4">
    <el-col :span="4">
      <el-popover ref="restart_processes"
                  trigger="click"
                  v-model="restart_selected_processes_visible">
        <p>Are you sure you want to restart these processes?</p>
        <div style="text-align: right; margin: 0">
          <el-button size="mini"
                     type="text"
                     @click="restart_selected_processes_visible = false">
            cancel
          </el-button>
          <el-button size="mini"
                     type="primary"
                     @click="restart_selected()">
            confirm
          </el-button>
        </div>
      </el-popover>

      <el-popover ref="stop_processes"
                  trigger="click"
                  v-model="stop_selected_processes_visible">
        <p>Are you sure you want to stop these processes?</p>
        <div style="text-align: right; margin: 0">
          <el-button size="mini"
                     type="text"
                     @click="stop_selected_processes_visible = false">
            cancel
          </el-button>
          <el-button size="mini"
                     type="primary"
                     @click="stop_selected()">
            confirm
          </el-button>
        </div>
      </el-popover>

      <el-tooltip class="item" content="restart/stop/log selected processes">
        <el-button-group>
          <el-button :disabled="!selected_processes.length"
                     v-popover:restart_processes
                     type="primary" size="small"
                     icon="el-icon-refresh">
         </el-button>

          <el-button :disabled="!selected_processes.length"
                     v-popover:stop_processes
                     type="primary" size="small"
                     icon="el-icon-close">
          </el-button>
        <el-button-group>
      </el-tooltip>
    </el-col>
    <el-col :span="6">
      <el-input placeholder="Filter..."
                v-model="search" style="direction:ltr;"
                size="small" clearable>
      </el-input>
    </el-col>
    <el-col :span="14" justify="end">
      <Summary style="text-align:right;" :multivisor="multivisor"></Summary>
    </el-col>
  </el-row>
  <el-row>
    <el-table class="process_table" :data="processes"
              :max-height="800" style="width: 100%; font-size:14px;"
              @selection-change="selected_processes_changed"
              :default-sort="{prop: 'supervisor', order: 'ascending'}"
              size="mini" stripe>
      <el-table-column type="expand" style="padding: 4px 0;">
        <template slot-scope="props">
          <ProcessDetails :process="props.row"></ProcessDetails>
        </template>
      </el-table-column>
      <el-table-column type="selection"></el-table-column>
      <el-table-column prop="name" label="Name" sortable>
      </el-table-column>
      <el-table-column prop="group" label="Group" sortable show-overflow-tooltip></el-table-column>
      <el-table-column prop="supervisor" label="Supervisor" sortable sort-by="supervisor">
       <template slot-scope="scope">
         <el-popover trigger="hover">
           <div>
             <el-button @click="multivisor.update_supervisor(scope.row.supervisor)"
                        size="small" >Update</el-button>
             <el-button @click="multivisor.reread_supervisor(scope.row.supervisor)"
                        size="small" >Reread</el-button>
             <el-button @click="multivisor.restart_supervisor(scope.row.supervisor)"
                        size="small" type="warning" >Restart</el-button>

             <el-button @click="multivisor.shutdown_supervisor(scope.row.supervisor)"
                        size="small" type="danger">Shutdown</el-button>
           </div>
           <el-button size="small" type="text" slot="reference">
             {{scope.row.supervisor}}
           </el-button>
         </el-popover>
       </template>

      </el-table-column>
      <el-table-column label="Status" sortable sort-by="statename">
        <template slot-scope="scope">
          <el-tag :type="state_to_tag[scope.row.statename]">
            {{scope.row.statename}}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <el-tooltip class="item" content="restart/stop/log process">
            <el-button-group>
              <el-button type="primary"
                         @click="multivisor.restart_process(scope.row.uid)"
                         icon="el-icon-refresh" size="small">
                </el-button>
              <el-button type="primary"
                         :disabled="!scope.row.running"
                         @click="multivisor.stop_process(scope.row.uid)"
                         icon="el-icon-close" size="small">
              </el-button>
              <!--<el-button @click="log(scope.row)" icon="el-icon-tickets">
              </el-button>-->
            </el-button-group>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </el-row>
<el-row>
</template>

<script>
import Summary from './Summary'
import ProcessDetails from './ProcessDetails'

export default {
  name: 'ProcessTable',
  props: ['multivisor'],

  components: {
    Summary,
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
      search: null,
      selected_processes: [],
      restart_selected_processes_visible: false,
      stop_selected_processes_visible: false,
    }
  },

  methods: {
    restart_selected() {
      let processes = this.selected_processes.slice();
      this.multivisor.restart_processes(processes);
      this.selected_processes = [];
      this.restart_selected_processes_visible = false;
    },
    stop_selected() {
      let processes = this.selected_processes.slice();
      this.multivisor.stop_processes(processes);
      this.selected_processes = [];
      this.stop_selected_processes_visible = false;
    },
    selected_processes_changed(val) {
      this.selected_processes = val;
    },

  },
  computed: {
    processes() {
      return this.multivisor.get_filtered_processes(this.multivisor, this.search);
    },
  }
}
</script>
