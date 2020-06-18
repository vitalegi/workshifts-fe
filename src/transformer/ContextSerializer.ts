import { WorkContext } from "@/models/WorkContext";
import { ApplicationContext } from "@/services/ApplicationContext";
import { Shift } from "@/models/Shift";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { Subgroup } from "@/models/Subgroup";
import { WeekConstraint } from "@/models/WeekConstraint";

export class ContextSerializer {
  private dateService = ApplicationContext.getInstance().getDateService();
  private actionService = ApplicationContext.getInstance().getActionService();

  public serializeContext(context: WorkContext, from: Date, to: Date): object {
    const outCtx = {
      date: this.dateService.format(context.date),
      employees: Array.from(context.employees.values()).map(e =>
        this.serializeEmployee(e)
      ),
      groups: Array.from(context.groups.values()).map(g =>
        this.serializeGroup(g)
      ),
      subgroups: Array.from(context.subgroups.values()).map(g =>
        this.serializeSubgroup(g)
      ),
      availableCars: context.availableCars.total,
      shifts: Array.from(context.workShifts.values()).map(s =>
        this.serializeShift(s)
      )
    };
    return outCtx;
  }

  protected serializeEmployee(employee: Employee) {
    return {
      id: employee.id,
      name: employee.name,
      subgroupId: employee.subgroupId,
      totWeekShifts: employee.totWeekShifts,
      maxWeekMornings: employee.maxWeekMornings,
      maxWeekAfternoons: employee.maxWeekAfternoons
    };
  }
  protected serializeGroup(group: Group) {
    return {
      id: group.id,
      name: group.name,
      constraints: group.constraints.map(c => this.serializeWeekConstraint(c))
    };
  }
  protected serializeSubgroup(subgroup: Subgroup) {
    return {
      id: subgroup.id,
      name: subgroup.name,
      groupId: subgroup.parent,
      constraints: subgroup.constraints.map(c =>
        this.serializeWeekConstraint(c)
      )
    };
  }
  protected serializeWeekConstraint(constraint: WeekConstraint) {
    return {
      dayOfWeek: this.dateService.getDayOfWeekName(constraint.dayOfWeek),
      type: constraint.type,
      action: this.actionService.getActionName(constraint.action),
      value: constraint.value
    };
  }
  protected serializeShift(shift: Shift) {
    return {
      employeeId: shift.employeeId,
      date: this.dateService.format(shift.date),
      value: shift.value
    };
  }
}
