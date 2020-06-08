import { WeekConstraint, TYPE_MIN } from "@/models/WeekConstraint";
import { DayOfWeek } from "@/utils/DayOfWeek";
import { Action } from "@/models/Action";

export class WeekConstraintService {
  public entries(
    constraints: Array<WeekConstraint>,
    dayOfWeek?: DayOfWeek,
    action?: Action,
    type?: string
  ): WeekConstraint[] {
    return constraints
      .filter((c) => dayOfWeek != undefined && dayOfWeek == c.dayOfWeek)
      .filter((c) => action != undefined && action == c.action)
      .filter((c) => type != undefined && type == c.type);
  }

  public getMinValue(
    constraints: Array<WeekConstraint>,
    dayOfWeek: DayOfWeek,
    action: Action
  ): number | undefined {
    const values = this.entries(constraints, dayOfWeek, action, TYPE_MIN);
    if (values.length == 0) {
      return undefined;
    }
    return values[0].value;
  }
}
