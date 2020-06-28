<template>
  <v-dialog v-model="hasErrors" max-width="290" persistent>
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text>
        {{ message }}
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn color="green darken-1" text @click.stop="acceptMessage()"
          >Close</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { factory } from "@/utils/ConfigLog4j";
import { ApplicationContext } from "@/services/ApplicationContext";
import {
  GlobalNotification,
  ErrorNotification
} from "@/utils/GlobalNotification";

import Vue from "vue";

const logger = factory.getLogger("components.ErrorDialog");

export default Vue.extend({
  name: "error-dialog",
  data() {
    return {
      notifications: ApplicationContext.getInstance().getErrorNotifications()
    };
  },
  computed: {
    hasErrors: {
      set(value: boolean) {
        logger.debug(() => `Set hasErrors: ${value}`);
      },
      get(): boolean {
        const hasErrors = this.notifications.has();
        logger.debug(() => `hasErrors: ${hasErrors}`);
        return this.notifications.has();
      }
    },
    title(): string {
      if (this.notifications.has()) {
        const title = this.notifications.get().title;
        return title;
      }
      return "";
    },
    message(): string {
      if (this.notifications.has()) {
        const message = this.notifications.get().message;
        return message;
      }
      return "";
    }
  },
  methods: {
    acceptMessage(): void {
      logger.info(() => `Message accepted.`);
      this.notifications.pop();
    }
  },
  watch: {
    notifications: {
      handler: (notification: GlobalNotification<ErrorNotification>) => {
        logger.info(() => `Remaining notifications ${notification.count()}`);
      },
      deep: true
    }
  }
});
</script>

<style scoped></style>
