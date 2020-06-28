<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        <h1>Turni Lavorativi</h1>
      </div>
    </v-app-bar>
    <error-dialog />
    <loader-dialog />
    <v-content>
      <v-row justify="space-between">
        <MonthPicker
          :initialValue="context.from"
          @update-date="handleUpdateDate"
        />
        <WorkShiftActions
          @update-validation="handleValidation"
          @export-json="handleExportJson"
          @import-json="handleImportJson"
          @export-excel="handleExportExcel"
          @clear-data="handleClearData"
          @optimize="handleOptimize"
        />
      </v-row>
      <v-row>
        <WorkShiftTable
          :context="context"
          :inlineValidation="inlineValidation"
          @update-shift="
            (employeeId, day, value) => handleShift(employeeId, day, value)
          "
        />
      </v-row>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import WorkShiftTable from "@/components/WorkShiftTable.vue";
import WorkShiftActions from "@/components/WorkShiftActions.vue";
import ErrorDialog from "@/components/ErrorDialog.vue";
import LoaderDialog from "@/components/LoaderDialog.vue";
import { WorkContext } from "@/models/WorkContext";
import { ApplicationContext } from "@/services/ApplicationContext";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { Subgroup } from "@/models/Subgroup";
import { Action } from "@/models/Action";
import { WeekConstraint } from "@/models/WeekConstraint";
import { factory } from "@/utils/ConfigLog4j";
import MonthPicker from "@/components/MonthPicker.vue";
import { ContextDeserializer } from "./transformer/ContextDeserializer";
import { ContextSerializer } from "./transformer/ContextSerializer";
import { saveAs } from "file-saver";
import { BackendWebService } from "./utils/WebService";
import { ErrorNotification } from "./utils/GlobalNotification";

@Component({
  components: {
    WorkShiftTable,
    MonthPicker,
    WorkShiftActions,
    ErrorDialog,
    LoaderDialog
  }
})
export default class App extends Vue {
  private logger = factory.getLogger("App");
  private context: WorkContext;
  private inlineValidation = true;

  constructor() {
    super();
    const dateService = ApplicationContext.getInstance().getDateService();
    const context = new WorkContext();
    this.context = context;
    context.date = dateService.parse(dateService.format(new Date()));

    App.group(context, 1, "Macro1", App.weekConstraint(0, 1, 1, 1));
    App.group(context, 2, "Macro2", App.weekConstraint(0, 1, 1, 1));
    App.group(context, 3, "Macro3", App.weekConstraint(0, 0, 0, 0));
    App.subgroup(context, 1, "Mogliano", 1, App.weekConstraint(1, 0, 0, 0));
    App.subgroup(context, 2, "Preganziol", 1, App.weekConstraint(1, 0, 0, 0));
    App.subgroup(
      context,
      3,
      "Casale / Roncade",
      1,
      App.weekConstraint(1, 0, 0, 0)
    );
    App.subgroup(context, 4, "S.Bona", 2, App.weekConstraint(1, 0, 0, 0));
    App.subgroup(context, 5, "c.città", 2, App.weekConstraint(1, 0, 0, 0));
    App.subgroup(context, 6, "S.Zeno", 2, App.weekConstraint(1, 0, 0, 0));
    App.subgroup(
      context,
      7,
      "S.Biagio Silea",
      2,
      App.weekConstraint(1, 0, 0, 0)
    );
    App.subgroup(context, 8, "CP", 3, App.weekConstraint(1, 0, 0, 0));

    App.employee(context, 1, "ALBORE P. SANDRO", 1, 5, 5, 2);
    App.employee(context, 2, "CHINELLATO MONIA", 1, 5, 5, 2);
    App.employee(context, 3, "GIACOMIN BARBARA", 1, 5, 5, 0);

    App.employee(context, 4, "RIGO FRANCESCA", 2, 5, 5, 2);
    App.employee(context, 5, "BARBATO GIUSEPPE", 2, 5, 5, 2);
    App.employee(context, 6, "VIALE MARTA", 2, 5, 5, 2);

    App.employee(context, 7, "COSTANTINI RENZO", 3, 5, 5, 2);
    App.employee(context, 8, "BERTON ELISABETTA", 3, 4, 4, 2);
    App.employee(context, 9, "TOZZATO MARTINA", 3, 5, 5, 2);

    App.employee(context, 10, "BERALDO SILVIA", 4, 5, 5, 2);
    App.employee(context, 11, "CITTON MARZIA", 4, 5, 5, 2);
    App.employee(context, 12, "CERON CESARE", 4, 5, 5, 2);

    App.employee(context, 13, "VANIN STEFANIA", 5, 5, 5, 2);
    App.employee(context, 14, "SERAFIN SERENA", 5, 5, 5, 2);
    App.employee(context, 15, "MAREN FABIO", 5, 5, 5, 2);

    App.employee(context, 16, "TONON CHRISTIAN", 6, 5, 5, 2);
    App.employee(context, 17, "CARPIN ANNALISA", 6, 5, 5, 2);

    App.employee(context, 18, "SPIGARIOL PAOLO", 7, 5, 5, 2);
    App.employee(context, 19, "VIANELLO MARTA", 7, 5, 5, 2);
    App.employee(context, 20, "BOT CLAUDIA", 7, 4, 4, 2);

    App.employee(context, 21, "BEZZI SILVIA", 8, 5, 5, 2);
    App.employee(context, 22, "BRUNELLO VANIA", 8, 5, 5, 2);

    context.availableCars.total = 10;
  }

  handleExportExcel() {
    this.logger.info(() => `Excel export`);

    new BackendWebService()
      .url("/workshifts-rest/export")
      .responseType("blob")
      .post()
      .headerJson()
      .call(
        new ContextSerializer().serializeContext(
          this.context,
          this.rangeStart(),
          this.rangeEnd()
        )
      )
      .then(response => {
        const blob = new Blob([response.data]);
        const formattedDate = ApplicationContext.getInstance()
          .getDateService()
          .formatYYYYMM(this.context.date);
        const filename = `Turni lavorativi ${formattedDate}.xlsx`;
        this.logger.info(() => `Save file as ${filename}`);
        saveAs(blob, filename);
      })
      .catch(error => {
        ApplicationContext.getInstance()
          .getErrorNotifications()
          .add(new ErrorNotification("Error", "Error exporting calendar"));
      });
  }
  handleValidation(validate: boolean) {
    this.logger.info(() => `Validation ${validate}`);
    this.inlineValidation = validate;
  }
  handleExportJson() {
    this.logger.info(() => `Json export`);
    const obj = new ContextSerializer().serializeContext(
      this.context,
      this.rangeStart(),
      this.rangeEnd()
    );
    const content = JSON.stringify(obj);
    const blob = new Blob([content], { type: "application/json" });
    saveAs(blob, "content.json");
  }

  handleImportJson(file: File) {
    this.logger.info(() => `importJson`);
    if (!file) {
      this.logger.info(() => `No selected file`);
      return null;
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const content = reader.result;
      this.logger.info(() => `File read completed`);
      if (content != null) {
        const json = content as string;
        const obj = JSON.parse(json);
        this.logger.info(() => `File is a valid json`);
        this.context = new ContextDeserializer().deserializeContext(obj);
        this.logger.info(() => `File is imported`);
      }
    };
  }

  handleUpdateDate(value: string): void {
    this.logger.info(() => `Update date: ${value}`);
    const dateService = ApplicationContext.getInstance().getDateService();
    this.context.date = dateService.parse(value);

    // make vue aware of the update
    this.context.workShifts.length;
  }
  handleClearData(): void {
    this.context.deleteShifts();
  }
  handleOptimize(): void {
    this.logger.info(() => `Optimize`);
    ApplicationContext.getInstance()
      .getOptimizeShiftsService()
      .optimize(this.context);
  }
  days(): number {
    return ApplicationContext.getInstance()
      .getDateService()
      .range(this.rangeStart(), this.rangeEnd()).length;
  }
  day(index: number): Date {
    const d = ApplicationContext.getInstance()
      .getDateService()
      .range(this.rangeStart(), this.rangeEnd())[index - 1];
    return d;
  }
  rangeStart(): Date {
    return ApplicationContext.getInstance()
      .getWorkShiftService()
      .rangeStart(this.context.date);
  }
  rangeEnd(): Date {
    return ApplicationContext.getInstance()
      .getWorkShiftService()
      .rangeEnd(this.context.date);
  }
  handleShift(employeeId: number, date: Date, value: string): void {
    this.logger.info(
      () => `New shift, employee ${employeeId}, day ${date}, value=${value}`
    );
    this.context.setShift(employeeId, date, value);
  }
  private static employee(
    context: WorkContext,
    id: number,
    name: string,
    subgroup: number | null,
    totWeekShifts: number,
    maxWeekMornings: number,
    maxWeekAfternoons: number
  ): Employee {
    const employee = new Employee();
    employee.id = id;
    employee.name = name;
    employee.totWeekShifts = totWeekShifts;
    employee.maxWeekMornings = maxWeekMornings;
    employee.maxWeekAfternoons = maxWeekAfternoons;
    employee.subgroupId = subgroup;
    context.employees.set(id, employee);
    return employee;
  }

  private static group(
    context: WorkContext,
    id: number,
    name: string,
    constraints: WeekConstraint[]
  ): Group {
    const group = new Group();
    group.id = id;
    group.name = name;
    group.constraints = constraints.map(c => c.clone());
    context.groups.set(id, group);
    return group;
  }

  private static subgroup(
    context: WorkContext,
    id: number,
    name: string,
    parentId: number,
    constraints: WeekConstraint[]
  ): Group {
    const subgroup = new Subgroup();
    subgroup.id = id;
    subgroup.name = name;
    subgroup.parent = parentId;
    subgroup.constraints = constraints.map(c => c.clone());
    context.subgroups.set(id, subgroup);
    return subgroup;
  }

  private static weekConstraint(
    minMorningsWeekdays: number,
    minAfternoonsWeekdays: number,
    minMorningsWeekends: number,
    minAfternoonsWeekends: number
  ): WeekConstraint[] {
    const list = new Array<WeekConstraint>();

    const dateService = ApplicationContext.getInstance().getDateService();
    dateService.getWeekdays().forEach(day => {
      list.push(WeekConstraint.min(day, Action.MORNING, minMorningsWeekdays));
      list.push(
        WeekConstraint.min(day, Action.AFTERNOON, minAfternoonsWeekdays)
      );
    });
    dateService.getWeekendDays().forEach(day => {
      list.push(WeekConstraint.min(day, Action.MORNING, minMorningsWeekends));
      list.push(
        WeekConstraint.min(day, Action.AFTERNOON, minAfternoonsWeekends)
      );
    });
    return list;
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
