<template>
  <v-col md="8">
    <v-row justify="end">
      <v-btn class="ma-2" color="primary" dark @click="handleExportJson"
        >Export
        <v-icon dark right>mdi-download</v-icon>
      </v-btn>
      <v-menu
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="290px"
      >
        <template v-slot:activator="{ on }">
          <v-btn class="ma-2" color="primary" dark v-on="on"
            >Import
            <v-icon dark right>mdi-upload</v-icon>
          </v-btn>
        </template>
        <v-file-input label="Import" @change="handleImportJson" />
      </v-menu>

      <v-btn class="ma-2" color="purple" dark @click="handleExportExcel"
        >Print
        <v-icon dark right>mdi-file-excel</v-icon>
      </v-btn>
      <v-btn class="ma-2" color="red" dark @click="handleClearData"
        >Delete
        <v-icon dark right>mdi-delete</v-icon>
      </v-btn>
      <v-btn class="ma-2" color="purple" dark @click="handleRandomize"
        >Randomize
        <v-icon dark right>mdi-nuke</v-icon>
      </v-btn>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { factory } from "@/utils/ConfigLog4j";

@Component({})
export default class WorkShiftActions extends Vue {
  private logger = factory.getLogger("WorkShiftActions");

  handleExportJson() {
    this.$emit("export-json");
  }
  handleImportJson(file: File) {
    this.$emit("import-json", file);
  }
  handleExportExcel() {
    this.$emit("export-excel");
  }
  handleClearData() {
    this.$emit("clear-data");
  }
  handleRandomize() {
    this.$emit("randomize");
  }
}
</script>

<style lang="scss"></style>
