export class Employee {
  private _id = 0;
  private _name = "";
  private _subgroupId: number | null = null;

  public totWeekShifts = 0;
  public maxWeekMornings = 0;
  public maxWeekAfternoons = 0;

  public set name(name: string) {
    this._name = name;
  }

  public get name() {
    return this._name;
  }
  public set id(id: number) {
    this._id = id;
  }

  public get id() {
    return this._id;
  }
  public set subgroupId(subgroupId: number | null) {
    this._subgroupId = subgroupId;
  }

  public get subgroupId() {
    return this._subgroupId;
  }
}
