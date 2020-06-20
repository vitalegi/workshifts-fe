import "babel-polyfill";
import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import vuetify from "./plugins/vuetify";
import axios from "axios";

Vue.use(Vuetify);
Vue.config.productionTip = false;

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
