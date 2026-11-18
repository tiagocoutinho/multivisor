import { defineStore } from "pinia";

export const INSPECTOR_TABS = new Set(["details", "out", "err"]);

export const useInspectorStore = defineStore("inspector", {
  state: () => ({
    uid: "",
    visible: false,
    tab: "details",
    height: 360,
    orderedUids: [],
  }),
  actions: {
    open(uid, tab = "details") {
      this.uid = uid;
      this.visible = true;
      this.tab = INSPECTOR_TABS.has(tab) ? tab : "details";
    },
    close() {
      this.visible = false;
    },
    setOrder(uids) {
      const validUids = [...new Set(uids.filter(Boolean))];
      this.orderedUids = validUids;
    },
    step(offset) {
      if (!offset || !this.orderedUids.length) {
        return;
      }
      const currentIndex = this.orderedUids.indexOf(this.uid);
      if (currentIndex === -1) {
        return;
      }
      this.uid = this.orderedUids[currentIndex + offset] || this.uid;
    },
  },
});
