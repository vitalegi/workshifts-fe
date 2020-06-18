import { WorkContext } from "@/models/WorkContext";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { WeekConstraint } from "@/models/WeekConstraint";
import { Subgroup } from "@/models/Subgroup";
import { ApplicationContext } from "@/services/ApplicationContext";
import { Shift } from "@/models/Shift";

export class ContextDeserializer {
  private dateService = ApplicationContext.getInstance().getDateService();
  private actionService = ApplicationContext.getInstance().getActionService();

  public deserializeContext(obj: object): WorkContext {
    const context = new WorkContext();
    context.date = this.dateValue(obj, "date");
    this.values(obj, "employees")
      .map(o => this.deserializeEmployee(o))
      .forEach(o => context.employees.set(o.id, o));
    this.values(obj, "groups")
      .map(o => this.deserializeGroup(o))
      .forEach(o => context.groups.set(o.id, o));
    this.values(obj, "subgroups")
      .map(o => this.deserializeSubgroup(o))
      .forEach(o => context.subgroups.set(o.id, o));
    this.values(obj, "shifts")
      .map(o => this.deserializeShift(o))
      .forEach(shift => {
        context.setShift(shift.employeeId, shift.date, shift.value);
      });
    context.availableCars.total = this.numberValue(obj, "availableCars");
    return context;
  }
  protected deserializeEmployee(obj: any): Employee {
    const e = new Employee();
    e.id = this.numberValue(obj, "id");
    e.name = this.stringValue(obj, "name");
    e.subgroupId = this.numberValue(obj, "subgroupId");
    e.totWeekShifts = this.numberValue(obj, "totWeekShifts");
    e.maxWeekMornings = this.numberValue(obj, "maxWeekMornings");
    e.maxWeekAfternoons = this.numberValue(obj, "maxWeekAfternoons");
    return e;
  }
  protected deserializeGroup(obj: any): Group {
    const g = new Group();
    g.id = this.numberValue(obj, "id");
    g.name = this.stringValue(obj, "name");
    this.values(obj, "constraints")
      .map(constraint => this.deserializeWeekConstraint(constraint))
      .forEach(constraint => g.constraints.push(constraint));
    return g;
  }
  protected deserializeSubgroup(obj: any): Subgroup {
    const g = new Subgroup();
    g.id = this.numberValue(obj, "id");
    g.name = this.stringValue(obj, "name");
    g.parent = this.numberValue(obj, "groupId");
    this.values(obj, "constraints")
      .map(constraint => this.deserializeWeekConstraint(constraint))
      .forEach(constraint => g.constraints.push(constraint));
    return g;
  }
  protected deserializeWeekConstraint(obj: object): WeekConstraint {
    const dayOfWeek = this.dateService.getDayOfWeekFromName(
      this.stringValue(obj, "dayOfWeek")
    );
    const action = this.actionService.getActionFromName(
      this.stringValue(obj, "action")
    );
    const value = this.numberValue(obj, "value");
    return WeekConstraint.min(dayOfWeek, action, value);
  }
  protected deserializeShift(obj: object): Shift {
    const employeeId = this.numberValue(obj, "employeeId");
    const date = this.dateValue(obj, "date");
    const value = this.stringValue(obj, "value");
    return new Shift(employeeId, date, value);
  }
  private dateValue(obj: any, key: string): Date {
    const value = this.stringValue(obj, key);
    return this.dateService.parse(value);
  }
  private numberValue(obj: any, key: string): number {
    const value = this.value(obj, key);
    return value as number;
  }
  private stringValue(obj: any, key: string): string {
    const value = this.value(obj, key);
    return value as string;
  }
  private values(obj: any, key: string): Array<object> {
    return this.value(obj, key) as Array<object>;
  }
  private value(obj: any, key: string): unknown {
    const keys = Object.keys(obj);
    let targetIndex = -1;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == key) {
        targetIndex = i;
      }
    }
    return Object.values(obj)[targetIndex];
  }
}
