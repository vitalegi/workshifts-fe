import { DayOfWeek } from "@/utils/DayOfWeek";
import { Action } from "@/models/Action";

export const TYPE_MIN = "min";

export class WeekConstraint {
  private _dayOfWeek: DayOfWeek = DayOfWeek.MONDAY;
  private _action: Action = Action.IDLE;
  private _type = "";
  private _value = 0;

  public constructor(
    dayOfWeek: DayOfWeek,
    action: Action,
    value: number,
    type: string
  ) {
    this.dayOfWeek = dayOfWeek;
    this.action = action;
    this.value = value;
    this.type = type;
  }

  public static min(
    dayOfWeek: DayOfWeek,
    action: Action,
    value: number
  ): WeekConstraint {
    return new WeekConstraint(dayOfWeek, action, value, TYPE_MIN);
  }

  public get dayOfWeek() {
    return this._dayOfWeek;
  }
  public set dayOfWeek(dayOfWeek: DayOfWeek) {
    this._dayOfWeek = dayOfWeek;
  }
  public get action() {
    return this._action;
  }
  public set action(action: Action) {
    this._action = action;
  }
  public get type() {
    return this._type;
  }
  public set type(type: string) {
    this._type = type;
  }
  public get value() {
    return this._value;
  }
  public set value(value: number) {
    this._value = value;
  }

  public clone(): WeekConstraint {
    return new WeekConstraint(
      this.dayOfWeek,
      this.action,
      this.value,
      this.type
    );
  }
}
