import en from "./locales/en";

export const stateColorMap = {
  STOPPED: "red",
  STARTING: "blue",
  RUNNING: "green",
  BACKOFF: "orange",
  STOPPING: "blue",
  EXITED: "red",
  FATAL: "purple",
  UNKNOWN: "grey",
};

export const notificationColorMap = {
  DEBUG: "grey darken-2",
  INFO: "grey darken-3",
  WARNING: "orange",
  ERROR: "error",
};

export const ALERT_STATES = new Set(["FATAL", "BACKOFF", "UNKNOWN"]);

export const stateClassMap = {
  RUNNING: "c-running",
  FATAL: "c-danger",
  BACKOFF: "c-attention",
  UNKNOWN: "c-attention",
  STARTING: "c-info",
  STOPPING: "c-info",
  STOPPED: "c-neutral",
  EXITED: "c-neutral",
};

export const countRunningProcesses = (processes) =>
  processes.filter((process) => process.statename === "RUNNING").length;

export const countAlertProcesses = (processes) =>
  processes.filter((process) => ALERT_STATES.has(process.statename)).length;

export const groupProcessesBySupervisor = (processes) => {
  const groups = new Map();
  for (const process of processes) {
    const groupedProcesses = groups.get(process.supervisor);
    if (groupedProcesses) {
      groupedProcesses.push(process);
    } else {
      groups.set(process.supervisor, [process]);
    }
  }
  return Array.from(groups, ([supervisor, groupedProcesses]) => ({
    supervisor,
    processes: groupedProcesses,
  }));
};

export const formatBytes = (bytes, decimals) => {
  if (bytes === 0) return "0 b";
  let k = 1024;
  let dm = decimals || 2;
  let sizes = ["b", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const timeAgo = (timestamp, templates = en.timeAgo) => {
  var template = function (t, n) {
    return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
  };

  var then = new Date(timestamp * 1000);

  var now = new Date();
  var seconds = ((now.getTime() - then) * 0.001) >> 0;
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var years = days / 365;

  return (
    templates.prefix +
    ((seconds < 45 && template("seconds", seconds)) ||
      (seconds < 90 && template("minute", 1)) ||
      (minutes < 45 && template("minutes", minutes)) ||
      (minutes < 90 && template("hour", 1)) ||
      (hours < 24 && template("hours", hours)) ||
      (hours < 42 && template("day", 1)) ||
      (days < 30 && template("days", days)) ||
      (days < 45 && template("month", 1)) ||
      (days < 365 && template("months", days / 30)) ||
      (years < 1.5 && template("year", 1)) ||
      template("years", years)) +
    templates.suffix
  );
};

export const nullMultivisor = {
  name: "Multivisor",
  supervisors: {},
};

export const nullProcess = {
  name: "",
  uid: "",
  pid: 0,
  description: "",
  exitstatus: 0,
  logfile: null,
  stderr_logfile: null,
  start: 0,
  now: 0,
};
