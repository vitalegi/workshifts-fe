<template>
  <v-container fluid>
    <v-row>
      <v-simple-table class="single-line" dense>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left start-of-group end-of-week" colspan="2">
                Name
              </th>
              <th
                v-for="dayId in days()"
                :key="dayId"
                :class="{
                  'end-of-week': isEndOfWeek(day(dayId)),
                  'table-header': true,
                  'text-center': true,
                  'start-of-group': true
                }"
              >
                {{ formatHeaderDate(day(dayId)) }}
              </th>
            </tr>
            <tr>
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
              >
                {{ getDayOfWeekLabel(day(dayId)) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tableElement in tableElements()"
              :key="tableElement.id + tableElement.type"
            >
              <td
                v-if="tableElement.isGroup()"
                colspan="2"
                class="start-of-group end-of-week table-element-name-1"
              >
                {{ getGroupName(tableElement.id) }}
              </td>

              <template v-if="tableElement.isGroup()">
                <td
                  v-for="dayId in days()"
                  :key="dayId"
                  :class="{
                    'end-of-week': isEndOfWeek(day(dayId)),
                    'start-of-group': true,
                    'full-space': true
                  }"
                >
                  <v-tooltip
                    top
                    v-if="hasGroupErrors(tableElement.id, day(dayId))"
                  >
                    <template v-slot:activator="{ on: onTooltip }">
                      <div v-on="onTooltip" class="errors">-</div>
                    </template>
                    <div
                      :key="error"
                      v-for="error in getGroupErrors(
                        tableElement.id,
                        day(dayId)
                      )"
                    >
                      {{ error }}
                    </div>
                  </v-tooltip>
                </td>
              </template>

              <td
                v-if="tableElement.isSubgroup()"
                class="start-of-subgroup end-of-week table-element-name-2"
                colspan="2"
              >
                {{ getSubgroupName(tableElement.id) }}
              </td>

              <template v-if="tableElement.isSubgroup()">
                <td
                  v-for="dayId in days()"
                  :key="dayId"
                  :class="{
                    'end-of-week': isEndOfWeek(day(dayId)),
                    'start-of-subgroup': true,
                    'full-space': true
                  }"
                >
                  <v-tooltip
                    top
                    v-if="hasSubgroupErrors(tableElement.id, day(dayId))"
                  >
                    <template v-slot:activator="{ on: onTooltip }">
                      <div v-on="onTooltip" class="errors">-</div>
                    </template>
                    <div
                      :key="error"
                      v-for="error in getSubgroupErrors(
                        tableElement.id,
                        day(dayId)
                      )"
                    >
                      {{ error }}
                    </div>
                  </v-tooltip>
                </td>
              </template>

              <td
                v-if="tableElement.isEmployee()"
                colspan="2"
                :class="{
                  'end-of-week': true,
                  'table-element-name-3': true,
                  'start-of-subgroup': isStartOfSubgroup(tableElement.id)
                }"
              >
                {{ tableElement.id }} -
                {{ context.getEmployee(tableElement.id).name }}
              </td>
              <template v-if="tableElement.isEmployee()">
                <td
                  v-for="dayId in days()"
                  :key="dayId"
                  :class="{
                    'end-of-week': isEndOfWeek(day(dayId)),
                    'start-of-subgroup': isStartOfSubgroup(tableElement.id),
                    'full-space': true
                  }"
                >
                  <v-tooltip
                    top
                    v-if="hasEmployeeErrors(tableElement.id, day(dayId))"
                  >
                    <template v-slot:activator="{ on: onTooltip }">
                      <span v-on="onTooltip">
                        <WorkShiftInput
                          :value="getShift(tableElement.id, day(dayId))"
                          :items="availableStates()"
                          :hasErrors="true"
                          @update-value="
                            v => handleShift(tableElement.id, day(dayId), v)
                          "
                        />
                      </span>
                    </template>
                    <div
                      :key="error"
                      v-for="error in getEmployeeErrors(
                        tableElement.id,
                        day(dayId)
                      )"
                    >
                      {{ error }}
                    </div>
                  </v-tooltip>
                  <WorkShiftInput
                    v-else
                    :value="getShift(tableElement.id, day(dayId))"
                    :items="availableStates()"
                    :hasErrors="false"
                    @update-value="
                      v => handleShift(tableElement.id, day(dayId), v)
                    "
                  />
                </td>
              </template>
            </tr>
            <tr>
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
                <v-tooltip
                  top
                  v-if="hasCarsErrors(morningAction(), day(dayId))"
                >
                  <template v-slot:activator="{ on: onTooltip }">
                    <span v-on="onTooltip">{{
                      getUsedCars(day(dayId), morningAction())
                    }}</span>
                  </template>
                  <span>
                    <div
                      :key="error"
                      v-for="error in getCarsErrors(
                        morningAction(),
                        day(dayId)
                      )"
                    >
                      {{ error }}
                    </div>
                  </span>
                </v-tooltip>
                <span v-else>{{
                  getUsedCars(day(dayId), morningAction())
                }}</span>
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
              >
                {{ getTotCars() }}
              </td>
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
                <v-tooltip
                  top
                  v-if="hasCarsErrors(afternoonAction(), day(dayId))"
                >
                  <template v-slot:activator="{ on: onTooltip }">
                    <span v-on="onTooltip">{{
                      getUsedCars(day(dayId), afternoonAction())
                    }}</span>
                  </template>
                  <span>
                    <div
                      :key="error"
                      v-for="error in getCarsErrors(
                        afternoonAction(),
                        day(dayId)
                      )"
                    >
                      {{ error }}
                    </div>
                  </span>
                </v-tooltip>
                <span v-else>{{
                  getUsedCars(day(dayId), afternoonAction())
                }}</span>
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
              >
                {{ getTotCars() }}
              </td>
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
import { WorkContext } from "@/models/WorkContext";
import { ApplicationContext } from "@/services/ApplicationContext";
import { factory } from "@/utils/ConfigLog4j";
import { Action } from "@/models/Action";
import { stats, cacheable } from "@/utils/Decorators";
import { CacheConfig, CacheConfigFactory } from "@/utils/Cache";

class TableElement {
  public static GROUP = "GROUP";
  public static SUBGROUP = "SUBGROUP";
  public static EMPLOYEE = "EMPLOYEE";

  public type: string;
  public id: number;

  public constructor(type: string, id: number) {
    this.type = type;
    this.id = id;
  }

  public isGroup(): boolean {
    return this.type == TableElement.GROUP;
  }

  public isSubgroup(): boolean {
    return this.type == TableElement.SUBGROUP;
  }

  public isEmployee(): boolean {
    return this.type == TableElement.EMPLOYEE;
  }
}

@Component({ components: { WorkShiftInput, MonthPicker } })
export default class WorkShiftTable extends Vue {
  private logger = factory.getLogger("components.WorkShiftTable");
  @Prop() private context!: WorkContext;

  constructor() {
    super();
  }

  increment() {
    this.$store.commit("increment");
    this.logger.info(() => `Store, increment: ${this.$store.state.count}`);
  }
  handleShift(employeeId: number, date: Date, value: string): void {
    this.logger.info(
      () => `New shift, employee ${employeeId}, day ${date}, value=${value}`
    );
    this.$emit("update-shift", employeeId, date, value);
  }
  @stats("WorkShiftTable")
  getShift(employeeId: number, date: Date): string {
    const employee = this.context.getEmployee(employeeId);
    const workshiftService = ApplicationContext.getInstance().getWorkShiftService();
    return workshiftService.getValue(this.context.workShifts, employee, date);
  }
  @stats("WorkShiftTable.cached")
  @cacheable(
    "WorkShiftTable.getEmployeeErrors",
    (args: any[]) => args[0] + "_" + (args[1] as Date).toISOString(),
    new CacheConfigFactory()
      .ttl(500)
      .maxSize(2000)
      .build()
  )
  @stats("WorkShiftTable.raw")
  getEmployeeErrors(employeeId: number, day: Date): Array<string> {
    return ApplicationContext.getInstance()
      .getShiftValidationService()
      .getEmployeeErrors(employeeId, day, this.context);
  }
  @stats("WorkShiftTable")
  hasEmployeeErrors(employeeId: number, day: Date): boolean {
    return this.getEmployeeErrors(employeeId, day).length > 0;
  }
  @stats("WorkShiftTable.cached")
  @cacheable(
    "WorkShiftTable.getGroupErrors",
    (args: any[]) => args[0] + "_" + (args[1] as Date).toISOString(),
    new CacheConfigFactory()
      .ttl(500)
      .maxSize(2000)
      .build()
  )
  @stats("WorkShiftTable.raw")
  getGroupErrors(groupId: number, day: Date): Array<string> {
    return ApplicationContext.getInstance()
      .getShiftValidationService()
      .getGroupErrors(groupId, day, this.context);
  }
  @stats("WorkShiftTable")
  hasGroupErrors(groupId: number, day: Date): boolean {
    return this.getGroupErrors(groupId, day).length > 0;
  }
  @stats("WorkShiftTable.cached")
  @cacheable(
    "WorkShiftTable.getSubgroupErrors",
    (args: any[]) => args[0] + "_" + (args[1] as Date).toISOString(),
    new CacheConfigFactory()
      .ttl(500)
      .maxSize(2000)
      .build()
  )
  @stats("WorkShiftTable.raw")
  getSubgroupErrors(groupId: number, day: Date): Array<string> {
    return ApplicationContext.getInstance()
      .getShiftValidationService()
      .getSubgroupErrors(groupId, day, this.context);
  }
  @stats("WorkShiftTable")
  hasSubgroupErrors(groupId: number, day: Date): boolean {
    return this.getSubgroupErrors(groupId, day).length > 0;
  }
  @stats("WorkShiftTable")
  getCarsErrors(action: Action, day: Date): Array<string> {
    return ApplicationContext.getInstance()
      .getShiftValidationService()
      .getCarsErrors(day, action, this.context);
  }
  @stats("WorkShiftTable")
  hasCarsErrors(action: Action, day: Date): boolean {
    return this.getCarsErrors(action, day).length > 0;
  }
  @stats("WorkShiftTable")
  employees(): Array<number> {
    return this.context.sortedEmployees();
  }
  @stats("WorkShiftTable")
  tableElements(): Array<TableElement> {
    return this.context
      .sortedEmployees()
      .map(employeeId => {
        const elements: TableElement[] = [];
        const group = this.context.getGroupByEmployee(employeeId);
        const subgroup = this.context.getSubgroupByEmployee(employeeId);
        if (this.isStartOfGroup(employeeId) && group) {
          elements.push(new TableElement(TableElement.GROUP, group.id));
        }
        if (this.isStartOfSubgroup(employeeId) && subgroup) {
          elements.push(new TableElement(TableElement.SUBGROUP, subgroup.id));
        }
        elements.push(new TableElement(TableElement.EMPLOYEE, employeeId));
        return elements;
      })
      .flatMap(elements => elements);
  }
  @stats("WorkShiftTable")
  formatHeaderDate(date: Date): string {
    return ApplicationContext.getInstance()
      .getDateService()
      .formatShort(date);
  }
  @stats("WorkShiftTable")
  getDayOfWeekLabel(date: Date): string {
    const dateService = ApplicationContext.getInstance().getDateService();
    return dateService.getDayOfWeekLabel(dateService.getDayOfWeek(date));
  }
  @stats("WorkShiftTable")
  days(): number {
    return ApplicationContext.getInstance()
      .getDateService()
      .range(this.rangeStart(), this.rangeEnd()).length;
  }

  @cacheable(
    "WorkShiftTable.day",
    (args: any[]) => args[0],
    CacheConfig.init(40, 1000)
  )
  @stats("WorkShiftTable")
  day(index: number): Date {
    const d = ApplicationContext.getInstance()
      .getDateService()
      .range(this.rangeStart(), this.rangeEnd())[index - 1];
    return d;
  }
  @cacheable("WorkShiftTable.rangeStart", (args: any[]) => "")
  @stats("WorkShiftTable")
  rangeStart(): Date {
    return ApplicationContext.getInstance()
      .getWorkShiftService()
      .rangeStart(this.context.date);
  }
  @cacheable("WorkShiftTable.rangeEnd", (args: any[]) => "")
  @stats("WorkShiftTable")
  rangeEnd(): Date {
    return ApplicationContext.getInstance()
      .getWorkShiftService()
      .rangeEnd(this.context.date);
  }
  @stats("WorkShiftTable")
  isEndOfWeek(date: Date): boolean {
    return ApplicationContext.getInstance()
      .getDateService()
      .isEndOfWeek(date);
  }

  @cacheable("WorkShiftTable.isStartOfSubgroup", (args: any[]) => args[0])
  @stats("WorkShiftTable")
  isStartOfSubgroup(employeeId: number): boolean {
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
  @stats("WorkShiftTable")
  isStartOfGroup(employeeId: number): boolean {
    const employees = this.employees();
    const index = employees.findIndex(id => id == employeeId);
    if (index == 0) {
      return true;
    }
    const prevEmployeeId = employees[index - 1];
    const currGroup = this.context.getGroupByEmployee(employeeId);
    const prevGroup = this.context.getGroupByEmployee(prevEmployeeId);
    if (currGroup?.id != prevGroup?.id) {
      return true;
    }
    return false;
  }
  getSubgroupName(subgroupId: number): string {
    const subgroup = this.context.getSubgroupById(subgroupId);
    if (subgroup) {
      return subgroup.name;
    }
    return "";
  }
  getGroupName(groupId: number): string {
    const group = this.context.getGroupById(groupId);
    if (group) {
      return group.name;
    }
    return "";
  }
  @stats("WorkShiftTable")
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
  availableStates(): Array<string> {
    return ApplicationContext.getInstance()
      .getActionService()
      .getAllLabels();
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

.table-element-name-1 {
  text-align: left;
  padding-left: 20px;
}

.table-element-name-2 {
  text-align: left;
  padding-left: 30px;
}

.table-element-name-3 {
  text-align: left;
  padding-left: 40px;
}
</style>
