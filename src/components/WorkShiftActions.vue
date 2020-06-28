<template>
  <v-col md="8">
    <v-row justify="end">
      <v-switch
        v-model="validate"
        label="Validazione attiva"
        @change="handleValidation"
      ></v-switch>
      <v-btn class="ma-2" color="primary" dark @click="handleExportJson">
        Save
        <v-icon dark right>mdi-content-save</v-icon>
      </v-btn>
      <v-menu
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="290px"
      >
        <template v-slot:activator="{ on }">
          <v-btn class="ma-2" color="primary" dark v-on="on">
            Open
            <v-icon dark right>mdi-file</v-icon>
          </v-btn>
        </template>
        <v-file-input label="Import" @change="handleImportJson" />
      </v-menu>

      <v-btn class="ma-2" color="purple" dark @click="handleExportExcel">
        Print
        <v-icon dark right>mdi-file-excel</v-icon>
      </v-btn>

      <v-dialog v-model="deleteDialog" persistent max-width="600px">
        <template v-slot:activator="{ on, attrs }">
          <v-btn class="ma-2" color="red" dark v-bind="attrs" v-on="on">
            Delete
            <v-icon dark right>mdi-delete</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="headline">Confirm deletion?</span>
          </v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="deleteDialog = false"
              >Cancel</v-btn
            >
            <v-btn
              color="blue darken-1"
              text
              @click="
                deleteDialog = false;
                handleClearData();
              "
              >Confirm</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-btn class="ma-2" color="purple" dark @click="handleOptimize">
        Optimize
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
  private validate = true;
  private deleteDialog = false;

  handleValidation() {
    this.logger.info(() => `validation: ${this.validate}`);
    this.$emit("update-validation", this.validate);
  }
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
  handleOptimize() {
    this.$emit("optimize");
  }
}
</script>

<style lang="scss"></style>
