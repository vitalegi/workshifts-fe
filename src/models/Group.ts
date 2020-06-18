import { WeekConstraint } from "@/models/WeekConstraint";

export class Group {
  private _id = 0;
  private _name = "";
  private _constraints = new Array<WeekConstraint>();

  public clone(): Group {
    return this.doClone(new Group());
  }

  protected doClone(clone: Group) {
    clone.id = this.id;
    clone.name = this.name;
    clone.constraints = this.constraints.map(c => c.clone());
    return clone;
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

  public set constraints(constraints: Array<WeekConstraint>) {
    this._constraints = constraints;
  }
  public get constraints() {
    return this._constraints;
  }

  public toString(): string {
    return `id ${this.id} name ${this.name} constraints ${this.constraints}`;
  }
}
