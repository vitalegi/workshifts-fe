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
      <WorkShiftTable :context="context" />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import WorkShiftTable from "@/components/WorkShiftTable.vue";
import { WorkContext } from "@/models/WorkContext";
import { ApplicationContext } from "@/services/ApplicationContext";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { Subgroup } from "@/models/Subgroup";
import { WeekConstraintBuilder } from "@/models/WeekConstraint";
import { DayOfWeek } from "@/utils/DayOfWeek";
import { Action } from "@/models/Action";

@Component({
  components: {
    WorkShiftTable
  }
})
export default class App extends Vue {
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

    context.availableCars.total = 2;
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
    constraints: WeekConstraintBuilder
  ): Group {
    const group = new Group();
    group.id = id;
    group.name = name;
    group.constraints = constraints.build();
    context.groups.set(id, group);
    return group;
  }

  private static subgroup(
    context: WorkContext,
    id: number,
    name: string,
    parentId: number,
    constraints: WeekConstraintBuilder
  ): Group {
    const subgroup = new Subgroup();
    subgroup.id = id;
    subgroup.name = name;
    subgroup.parent = parentId;
    subgroup.constraints = constraints.build();
    context.subgroups.set(id, subgroup);
    return subgroup;
  }

  private static weekConstraint(
    minMorningsWeekdays: number,
    minAfternoonsWeekdays: number,
    minMorningsWeekends: number,
    minAfternoonsWeekends: number
  ): WeekConstraintBuilder {
    const builder = WeekConstraintBuilder.newInstance();
    const weekdays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY
    ];
    const weekends = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
    weekdays.forEach(day => {
      builder.setMin(day, Action.MORNING, minMorningsWeekdays);
      builder.setMin(day, Action.AFTERNOON, minAfternoonsWeekdays);
    });
    weekends.forEach(day => {
      builder.setMin(day, Action.MORNING, minMorningsWeekends);
      builder.setMin(day, Action.AFTERNOON, minAfternoonsWeekends);
    });
    return builder;
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
