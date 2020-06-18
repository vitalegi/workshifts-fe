export class Shift {
  private _employeeId = 0;
  private _date = new Date();
  private _value = "";

  public constructor(employeeId: number, date: Date, value: string) {
    this.employeeId = employeeId;
    this.date = date;
    this.value = value;
  }

  public clone(): Shift {
    return new Shift(this.employeeId, this.date, this.value);
  }

  public get employeeId() {
    return this._employeeId;
  }
  public set employeeId(employeeId: number) {
    this._employeeId = employeeId;
  }
  public get date() {
    return this._date;
  }
  public set date(date: Date) {
    this._date = date;
  }
  public get value() {
    return this._value;
  }
  public set value(value: string) {
    this._value = value;
  }
}
