import { DayOfWeek } from "@/utils/DayOfWeek";
import { Action } from "@/models/Action";

export class WeekConstraint {
  private _constraints: Map<string, number> = new Map();

  public clone(): WeekConstraint {
    const clone = new WeekConstraint();
    Array.from(this._constraints.entries()).forEach(entry => {
        clone._constraints.set(entry[0], entry[1]);
    });
    return clone;
  }
  public setMin(dayOfWeek: DayOfWeek, action: Action, value: number): void {
    this._constraints.set(this.key(dayOfWeek, action, "min"), value);
  }

  public getMin(dayOfWeek: DayOfWeek, action: Action): number {
    const value = this._constraints.get(this.key(dayOfWeek, action, "min"));
    if (typeof value === "undefined") {
      return 0;
    }
    return value;
  }

  private key(dayOfWeek: DayOfWeek, action: Action, type: string) {
    return `${dayOfWeek}_${action}_${type}`;
  }
}

export class WeekConstraintBuilder {
  private _instance = new WeekConstraint();

  public static newInstance(): WeekConstraintBuilder {
    return new WeekConstraintBuilder();
  }

  public setMin(
    dayOfWeek: DayOfWeek,
    action: Action,
    value: number
  ): WeekConstraintBuilder {
    this._instance.setMin(dayOfWeek, action, value);
    return this;
  }
  public build(): WeekConstraint {
    return this._instance.clone();
  }
}
