import { Group } from "./Group";

export class Subgroup extends Group {
  private _parent?: number;

  public constructor() {
    super();
  }

  public clone(): Subgroup {
    const clone = super.doClone(new Subgroup()) as Subgroup;
    clone.parent = this.parent;
    return clone;
  }

  public set parent(parent: number) {
    this._parent = parent;
  }

  public get parent(): number {
    if (this._parent === undefined) {
      throw Error(`Missing parent for ${this}`);
    } else {
      return this._parent;
    }
  }
}
