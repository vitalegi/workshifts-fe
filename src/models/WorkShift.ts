import { Employee } from "./Employee";
import { Action } from "./Action";
import { ApplicationContext } from "../services/ApplicationContext";

export class WorkShift {
  private _shifts: any;

  public constructor() {
    this._shifts = {};
  }

  public get shift(): any {
    return this._shifts;
  }

  public set shift(shift: any) {
    this._shifts = shift;
  }

  public getValue(employee: Employee, day: Date): string {
    const key: string = this.key(employee, day);
    const value = this._shifts[key];
    if (value) {
      return value as string;
    }
    return ApplicationContext.getInstance()
      .getActionService()
      .getDefaultLabel();
  }

  public getAction(employee: Employee, day: Date): Action {
    const label = this.getValue(employee, day);
    return ApplicationContext.getInstance()
      .getActionService()
      .getAction(label);
  }

  public key(employee: Employee, day: Date): string {
    return (
      employee.id +
      "_" +
      ApplicationContext.getInstance()
        .getDateService()
        .format(day)
    );
  }
}
