<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <div class="hello">
          <h1>Turni Lavorativi</h1>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <MonthPicker :initialValue="context.from" @update-date="handleUpdateFromDate" />
      </v-col>
    </v-row>
    <v-row>
      <v-simple-table class="single-line" dense>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left start-of-group">Name</th>
              <th class="text-left start-of-group">Group</th>
              <th class="text-left start-of-group end-of-week">Subgroup</th>
              <th
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true,
                  'start-of-group': true
                }"
              >{{ formatHeaderDate(day(dayId)) }}</th>
            </tr>
            <tr>
              <th class="text-left"></th>
              <th class="text-left"></th>
              <th class="text-left end-of-week"></th>
              <th
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true
                }"
              >{{ getDayOfWeekLabel(day(dayId)) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employeeId in employees()" :key="employeeId">
              <td>{{ employeeId }} - {{ context.getEmployee(employeeId).name }}</td>
              <td>{{ getGroupName(employeeId) }}</td>
              <td class="end-of-week">{{ getSubgroupName(employeeId) }}</td>
              <td
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'start-of-group': isStartOfGroup(employeeId),
                  'start-of-subgroup': isStartOfSubgroup(employeeId),
                  'full-space': true
                }"
              >
                <v-tooltip top v-if="hasEmployeeErrors(employeeId, day(dayId))">
                  <template v-slot:activator="{ on: onTooltip }">
                    <span v-on="onTooltip">
                      <WorkShiftInput
                        :initialValue="getShift(employeeId, day(dayId))"
                        :items="availableStates"
                        :hasErrors="true"
                        @update-value="
                          v => handleShift(employeeId, day(dayId), v)
                        "
                      />
                    </span>
                  </template>
                  <span>
                    <div
                      :key="error"
                      v-for="error in getEmployeeErrors(employeeId, day(dayId))"
                    >{{ error }}</div>
                  </span>
                </v-tooltip>
                <WorkShiftInput
                  v-else
                  :initialValue="getShift(employeeId, day(dayId))"
                  :items="availableStates"
                  :hasErrors="false"
                  @update-value="v => handleShift(employeeId, day(dayId), v)"
                />
              </td>
            </tr>
            <tr>
              <td class="text-left" rowspan="4">Cars</td>
              <td class="text-left" rowspan="2">Mattina</td>
              <td class="text-left end-of-week">Usate</td>
              <td
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true,
                  errors: hasCarsErrors(morningAction(), day(dayId))
                }"
              >
                <v-tooltip top v-if="hasCarsErrors(morningAction(), day(dayId))">
                  <template v-slot:activator="{ on: onTooltip }">
                    <span v-on="onTooltip">
                      {{
                      getUsedCars(day(dayId), morningAction())
                      }}
                    </span>
                  </template>
                  <span>
                    <div
                      :key="error"
                      v-for="error in getCarsErrors(
                        morningAction(),
                        day(dayId)
                      )"
                    >{{ error }}</div>
                  </span>
                </v-tooltip>
                <span v-else>
                  {{
                  getUsedCars(day(dayId), morningAction())
                  }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="text-left end-of-week">Disponibili</td>
              <td
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true
                }"
              >{{ getTotCars() }}</td>
            </tr>
            <tr>
              <td class="text-left" rowspan="2">Pomeriggio</td>
              <td class="text-left end-of-week">Usate</td>
              <td
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true,
                  errors: hasCarsErrors(afternoonAction(), day(dayId))
                }"
              >
                <v-tooltip top v-if="hasCarsErrors(afternoonAction(), day(dayId))">
                  <template v-slot:activator="{ on: onTooltip }">
                    <span v-on="onTooltip">
                      {{
                      getUsedCars(day(dayId), afternoonAction())
                      }}
                    </span>
                  </template>
                  <span>
                    <div
                      :key="error"
                      v-for="error in getCarsErrors(
                        afternoonAction(),
                        day(dayId)
                      )"
                    >{{ error }}</div>
                  </span>
                </v-tooltip>
                <span v-else>
                  {{
                  getUsedCars(day(dayId), afternoonAction())
                  }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="text-left end-of-week">Disponibili</td>
              <td
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true
                }"
              >{{ getTotCars() }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import WorkShiftInput from "./WorkShiftInput.vue";
import MonthPicker from "./MonthPicker.vue";
import { WorkContext } from "../models/WorkContext";
import { ApplicationContext } from "../services/ApplicationContext";
import { factory } from "../utils/ConfigLog4j";
import { Action } from "../models/Action";
import { stats, cacheable } from "@/utils/Decorators";
import { CacheConfig } from "@/utils/Cache";

@Component({ components: { WorkShiftInput, MonthPicker } })
export default class WorkShiftTable extends Vue {
  private logger = factory.getLogger("components.WorkShiftTable");
  @Prop() private context!: WorkContext;
  @Prop() private availableStates!: Array<string>;

  constructor() {
    super();
  }

  increment() {
    this.$store.commit("increment");
    this.logger.info(() => `Store, increment: ${this.$store.state.count}`);
  }
  handleUpdateFromDate(value: string): void {
    this.logger.info(() => `Update from date: ${value}`);
    const dateService = ApplicationContext.getInstance().getDateService();
    const date = dateService.parse(value);

    const startOfMonth = dateService.getStartOfMonth(date);
    const endOfMonth = dateService.getEndOfMonth(date);
    this.context.from = dateService.getStartOfWeek(startOfMonth);
    this.context.to = dateService.getEndOfWeek(endOfMonth);
  }
  handleShift(employeeId: number, date: Date, value: string): void {
    this.logger.info(
      () => `New shift, employee ${employeeId}, day ${date}, value=${value}`
    );
    const employee = this.context.getEmployee(employeeId);
    const key: string = this.context.workShift.key(employee, date);
    Vue.set(this.context.workShift.shift, key, value);
  }
  @stats()
  getShift(employeeId: number, date: Date): string {
    const employee = this.context.getEmployee(employeeId);
    return this.context.workShift.getValue(employee, date);
  }
  @cacheable(
    "WorkShiftTable.getEmployeeErrors",
    (args: any[]) => args[0] + "_" + (args[1] as Date).toISOString()
  )
  @stats()
  getEmployeeErrors(employeeId: number, day: Date): Array<string> {
    return ApplicationContext.getInstance()
      .getShiftValidationService()
      .getEmployeeErrors(employeeId, day, this.context);
  }

  @stats()
  hasEmployeeErrors(employeeId: number, day: Date): boolean {
    return this.getEmployeeErrors(employeeId, day).length > 0;
  }
  @stats()
  getCarsErrors(action: Action, day: Date): Array<string> {
    return ApplicationContext.getInstance()
      .getShiftValidationService()
      .getCarsErrors(day, action, this.context);
  }
  @stats()
  hasCarsErrors(action: Action, day: Date): boolean {
    return this.getCarsErrors(action, day).length > 0;
  }
  @stats()
  employees(): Array<number> {
    return this.context.sortedEmployees();
  }
  @stats()
  formatHeaderDate(date: Date): string {
    return ApplicationContext.getInstance()
      .getDateService()
      .formatShort(date);
  }
  @stats()
  getDayOfWeekLabel(date: Date): string {
    return ApplicationContext.getInstance()
      .getDateService()
      .getDayOfWeekLabel(date);
  }
  @stats()
  days(): number {
    return ApplicationContext.getInstance()
      .getDateService()
      .range(this.context.from, this.context.to).length;
  }

  @cacheable(
    "WorkShiftTable.day",
    (args: any[]) => args[0],
    CacheConfig.init(40, 10)
  )
  @stats()
  day(index: number): Date {
    const d = ApplicationContext.getInstance()
      .getDateService()
      .range(this.context.from, this.context.to)[index - 1];
    return d;
  }
  @stats()
  isEndOfWeek(date: Date): boolean {
    return ApplicationContext.getInstance()
      .getDateService()
      .isEndOfWeek(date);
  }

  @cacheable("WorkShiftTable.isStartOfSubgroup", (args: any[]) => args[0])
  @stats()
  isStartOfSubgroup(employeeId: number): boolean {
    if (this.isStartOfGroup(employeeId)) {
      return false;
    }
    const employees = this.employees();
    const index = employees.findIndex(id => id == employeeId);
    if (index == 0) {
      return true;
    }
    const prevEmployeeId = employees[index - 1];
    const currEmployee = this.context.getEmployee(employeeId);
    const prevEmployee = this.context.getEmployee(prevEmployeeId);
    if (currEmployee.subgroupId != prevEmployee.subgroupId) {
      return true;
    }
    return false;
  }
  @cacheable("WorkShiftTable.isStartOfGroup", (args: any[]) => args[0])
  @stats()
  isStartOfGroup(employeeId: number): boolean {
    const employees = this.employees();
    const index = employees.findIndex(id => id == employeeId);
    if (index == 0) {
      return true;
    }
    const prevEmployeeId = employees[index - 1];
    const currGroup = this.context.getGroup(employeeId);
    const prevGroup = this.context.getGroup(prevEmployeeId);
    if (currGroup?.id != prevGroup?.id) {
      return true;
    }
    return false;
  }
  getSubgroupName(employeeId: number): string {
    const subgroup = this.context.getSubgroup(employeeId);
    if (subgroup) {
      return subgroup.name;
    }
    return "";
  }
  getGroupName(employeeId: number): string {
    const group = this.context.getGroup(employeeId);
    if (group) {
      return group.name;
    }
    return "";
  }
  @stats()
  getUsedCars(date: Date, action: Action): number {
    const service = ApplicationContext.getInstance().getWorkShiftService();
    const a = service.countByEmployeesDatesAction(
      this.employees(),
      [date],
      action,
      this.context
    );
    service.countByEmployeesDatesAction(
      this.employees(),
      [date],
      action,
      this.context
    );
    return a;
  }
  getTotCars(): number {
    return this.context.availableCars.total;
  }
  morningAction(): Action {
    return Action.MORNING;
  }
  afternoonAction(): Action {
    return Action.AFTERNOON;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.single-line {
  white-space: nowrap;
}

.end-of-week {
  border-right-style: solid;
  border-right-width: 1px;
}

.start-of-week {
  border-left-style: solid;
  border-left-width: 1px;
}

.start-of-group {
  border-top-style: solid;
  border-top-width: 2px;
}

.start-of-subgroup {
  border-top-style: solid;
  border-top-width: 1px;
}

.full-space {
  width: 100% !important;
  height: 100% !important;
  padding: 0px;
}

.table-header {
  padding: 3px;
}

.errors {
  color: rgb(156, 45, 117);
  background-color: rgb(255, 199, 206);
}
</style>
