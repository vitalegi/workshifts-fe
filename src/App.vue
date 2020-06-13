<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition"
          width="40"
        />

        <v-img
          alt="Vuetify Name"
          class="shrink mt-1 hidden-sm-and-down"
          contain
          min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100"
        />
      </div>

      <v-spacer></v-spacer>

      <v-btn href="https://github.com/vuetifyjs/vuetify/releases/latest" target="_blank" text>
        <span class="mr-2">Latest Release</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <v-row justify="space-between">
        <MonthPicker :initialValue="context.from" @update-date="handleUpdateFromDate" />
        <WorkShiftActions
          @export-json="handleExportJson"
          @import-json="handleImportJson"
          @export-excel="handleExportExcel"
          @clear-data="handleClearData"
          @randomize="handleRandomize"
        />
      </v-row>
      <v-row>
        <WorkShiftTable
          :context="context"
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
import { WorkContext } from "@/models/WorkContext";
import { ApplicationContext } from "@/services/ApplicationContext";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { Subgroup } from "@/models/Subgroup";
import { DayOfWeek } from "@/utils/DayOfWeek";
import { Action } from "@/models/Action";
import { WeekConstraint } from "@/models/WeekConstraint";
import { factory } from "@/utils/ConfigLog4j";
import { ArrayUtil } from "@/utils/ArrayUtil";
import { Shift } from "@/models/Shift";
import MonthPicker from "@/components/MonthPicker.vue";
import { ContextDeserializer } from "./transformer/ContextDeserializer";
import { ContextSerializer } from "./transformer/ContextSerializer";
import { saveAs } from "file-saver";

@Component({
  components: {
    WorkShiftTable,
    MonthPicker,
    WorkShiftActions
  }
})
export default class App extends Vue {
  private logger = factory.getLogger("App");
  private context: WorkContext;

  constructor() {
    super();
    const dateService = ApplicationContext.getInstance().getDateService();
    const context = new WorkContext();
    this.context = context;
    context.date = dateService.parse("2020-02-01");

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

    context.availableCars.total = 5;
  }

  handleExportExcel() {
    this.logger.info(() => `Excel export`);

    fetch("http://localhost:8081/workshifts-rest/export", {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      method: "POST",
      body: JSON.stringify(
        new ContextSerializer().serializeContext(
          this.context,
          this.rangeStart(),
          this.rangeEnd()
        )
      )
    }).then(response => {
      const blob = response.blob();
      blob.then(b => {
        const filename = "export.xlsx";
        this.logger.info(() => `Save file as ${filename}`);
        saveAs(b, filename);
      });
    });
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

  handleUpdateFromDate(value: string): void {
    this.logger.info(() => `Update from date: ${value}`);
    const dateService = ApplicationContext.getInstance().getDateService();
    this.context.date = dateService.parse(value);
  }
  handleClearData(): void {
    this.context.workShifts.splice(0, this.context.workShifts.length);
  }
  handleRandomize(): void {
    const employeeIds = this.context.sortedEmployees();
    const days = this.days();
    const labels = ["M", "M*", "P", "mal"];
    const random = (size: number) => Math.floor(Math.random() * size);
    for (let i = 0; i < 500; i++) {
      const employeeId = employeeIds[random(employeeIds.length)];
      const day = this.day(random(days - 1) + 1);
      const label = labels[random(labels.length)];
      this.handleShift(employeeId, day, label);
    }
  }
  exportWorkShift(): void {
    this.$emit("export");
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
    const employee = this.context.getEmployee(employeeId);

    ArrayUtil.delete(
      this.context.workShifts,
      s =>
        s.employeeId == employee.id &&
        s.date.toISOString() == date.toISOString()
    );
    const shift = new Shift(employeeId, date, value);
    this.context.workShifts.push(shift);
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

    const weekdays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY
    ];
    const weekends = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
    weekdays.forEach(day => {
      list.push(WeekConstraint.min(day, Action.MORNING, minMorningsWeekdays));
      list.push(WeekConstraint.min(day, Action.AFTERNOON, minMorningsWeekdays));
    });
    weekends.forEach(day => {
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
