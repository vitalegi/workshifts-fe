<template>
  <div
    :class="{
      'text-center': true,
      'errors': hasErrors
    }"
  >
    <v-menu offset-y>
      <template v-slot:activator="{ on: onMenu }">
        <span v-on="onMenu">{{ value }}</span>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          v-on:click="select(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class WorkShiftInput extends Vue {
  @Prop() private items!: Array<string>;
  @Prop() private initialValue!: string;
  private currentValue = "";
  @Prop() private hasErrors!: boolean;

  public get value(): string {
    if (this.currentValue == "") {
      return this.initialValue;
    }
    return this.currentValue;
  }

  public set value(value: string) {
    this.currentValue = value;
  }

  private select(value: string) {
    this.value = value;
    this.$emit("update-value", this.value);
  }
}
</script>
<style scoped>
.errors {
  color: rgb(156, 45, 117);
  background-color: rgb(255, 199, 206);
}
</style>
