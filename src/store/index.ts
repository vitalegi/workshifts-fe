import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10)
  },
  mutations: {
    increment(state) {
      state.count++;
    },
    updateFromDate(state, date) {
      state.fromDate = date;
    },
    updateToDate(state, date) {
      state.toDate = date;
    }
  },
  actions: {},
  modules: {}
});
