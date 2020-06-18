<template>
  <v-col md="2">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-right="40"
      transition="scale-transition"
      offset-y
      min-width="290px"
    >
      <template v-slot:activator="{ on }">
        <v-text-field
          v-model="currentValue"
          label="Mese di riferimento"
          readonly
          width="30"
          v-on="on"
        ></v-text-field>
      </template>
      <v-date-picker
        v-model="currentValue"
        type="month"
        @input="menu = false"
        v-on:change="update"
      ></v-date-picker>
    </v-menu>
  </v-col>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { factory } from "../utils/ConfigLog4j";

@Component
export default class MonthPicker extends Vue {
  private logger = factory.getLogger("components.MonthPicker");

  @Prop() private value!: Date;

  private currentValue = "";
  private menu = false;

  private get model() {
    if (this.currentValue == "") {
      this.currentValue = this.value.toUTCString().substring(0, 10);
    }
    return this.currentValue;
  }
  private set model(value: string) {
    this.currentValue = value;
  }

  update() {
    this.logger.info(() => `Updated month: ${this.currentValue}`);
    this.$emit("update-date", this.currentValue + "-01");
  }
}
</script>

<style scoped></style>
