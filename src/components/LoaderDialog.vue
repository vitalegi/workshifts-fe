<template>
  <v-overlay :value="dialog">
    <v-dialog v-model="dialog" hide-overlay persistent width="300">
      <v-card color="primary" dark>
        <v-card-text
          >Processing
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-overlay>
</template>

<script lang="ts">
import { factory } from "@/utils/ConfigLog4j";

import Vue from "vue";
import EventBus from "../utils/EventBus";

const logger = factory.getLogger("components.LoaderDialog");

export default Vue.extend({
  name: "error-dialog",
  data() {
    return {
      pending: 0
    };
  },
  computed: {
    dialog(): boolean {
      return this.pending > 0;
    }
  },
  mounted() {
    EventBus.$on("ASYNC_ACTION_START", (payload: any) => {
      this.pending++;
      logger.info(`async action started, pending ${this.pending}: ${payload}`);
    });
    EventBus.$on("ASYNC_ACTION_END", (payload: any) => {
      this.pending--;
      logger.info(`async action ended, pending ${this.pending}: ${payload}`);
    });
  }
});
</script>

<style scoped></style>
