export class AvailableCars {
  private _total = 0;

  public set total(total: number) {
    this._total = total;
  }

  public get total() {
    return this._total;
  }
}
