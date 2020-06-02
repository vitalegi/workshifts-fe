import { Group } from "./Group";

export class Subgroup extends Group {
  private _parent?: number;

  public constructor() {
    super();
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
