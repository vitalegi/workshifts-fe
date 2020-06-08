import { WorkContext } from "@/models/WorkContext";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { WeekConstraint } from "@/models/WeekConstraint";
import { Subgroup } from "@/models/Subgroup";
import { ApplicationContext } from "@/services/ApplicationContext";
import { DayOfWeek } from "@/utils/DayOfWeek";
import { Action } from "@/models/Action";
import { WorkContextIO } from "@/transformer/WorkContextIO";

export class ContextDeserializer {
  private dateService = ApplicationContext.getInstance().getDateService();
  private actionService = ApplicationContext.getInstance().getActionService();

  public deserializeContext(obj: WorkContextIO): WorkContext {
    const context = new WorkContext();
    context.date = this.dateService.parse(obj.date);
    obj.employees.forEach((e) => context.employees.set(e.id, e));
    obj.groups.forEach((g) => context.groups.set(g.id, g));
    obj.subgroups.forEach((g) => context.subgroups.set(g.id, g));
    obj.shifts.forEach((s) => context.workShifts.push(s));
    context.availableCars.total = obj.availableCars;
    return context;
  }

  public deserializeEmployee(obj: any): Employee {
    const e = new Employee();
    e.id = this.numberValue(obj, "id");
    e.name = this.stringValue(obj, "name");
    e.subgroupId = this.numberValue(obj, "subgroupId");
    e.totWeekShifts = this.numberValue(obj, "totWeekShifts");
    e.maxWeekMornings = this.numberValue(obj, "maxWeekMornings");
    e.maxWeekAfternoons = this.numberValue(obj, "maxWeekAfternoons");
    return e;
  }

  public deserializeGroup(obj: any): Group {
    const g = new Group();
    g.id = this.numberValue(obj, "id");
    g.name = this.stringValue(obj, "name");
    this.values(obj, "constraints")
      .map((constraint) => this.deserializeWeekConstraint(constraint))
      .forEach((constraint) => g.constraints.push(constraint));
    return g;
  }

  public deserializeSubgroup(obj: any): Subgroup {
    const g = new Subgroup();
    g.id = this.numberValue(obj, "id");
    g.name = this.stringValue(obj, "name");
    g.parent = this.numberValue(obj, "groupId");
    this.values(obj, "constraints")
      .map((constraint) => this.deserializeWeekConstraint(constraint))
      .forEach((constraint) => g.constraints.push(constraint));
    return g;
  }

  public deserializeWeekConstraint(obj: object): WeekConstraint {
    const dayOfWeek = this.dateService.getDayOfWeekFromName(
      this.stringValue(obj, "dayOfWeek")
    );
    const action = this.actionService.getActionFromName(
      this.stringValue(obj, "action")
    );
    const value = this.numberValue(obj, "value");
    return WeekConstraint.min(dayOfWeek, action, value);
  }

  private dateValue(obj: any, key: string): Date {
    const value = this.stringValue(obj, key);
    console.log(value);
    return this.dateService.parse(value);
  }
  private numberValue(obj: any, key: string): number {
    const value = this.value(obj, key);
    console.log(value);
    return value as number;
  }
  private stringValue(obj: any, key: string): string {
    const value = this.value(obj, key);
    return value as string;
  }
  private values(obj: any, key: string): Array<object> {
    const values = this.value(obj, key) as Array<Array<object>>;
    if (!Array.isArray(values)) {
      throw new Error(
        `Property ${key} on object is not an array. Object: ${obj}`
      );
    }
    return values[0];
  }
  private value(obj: any, key: string): unknown {
    return Object.entries(obj)
      .filter((entry) => entry[0] == key)
      .map((entry) => entry[1])
      .map((v) => {
        console.log("raw value");
        console.log(v);
        return v;
      })
      .map((value) => value as unknown);
  }
}
