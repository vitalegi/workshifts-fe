import { WeekConstraint } from "@/models/WeekConstraint";

export class Group {
  private _id = 0;
  private _name = "";
  private _constraints = new WeekConstraint();

  public clone(): Group {
    const group = new Group();
    group.id = this.id;
    group.name = this.name;
    return group;
  }

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

  public set constraints(constraints: WeekConstraint) {
    this._constraints = constraints;
  }
  public get constraints() {
    return this._constraints;
  }
}
