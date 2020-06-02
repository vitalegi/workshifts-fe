import { Employee } from "./Employee";
import { AvailableCars } from "./AvailableCars";
import { WorkShift } from "./WorkShift";
import { Subgroup } from "./Subgroup";
import { Group } from "./Group";

export class WorkContext {
  private _from: Date;
  private _to: Date;
  private _employees: Map<number, Employee>;
  private _groups: Map<number, Group>;
  private _subgroups: Map<number, Subgroup>;
  private _availableCars: AvailableCars;
  private _workShift: WorkShift;

  public constructor() {
    this._from = new Date();
    this._to = new Date();
    this._employees = new Map();
    this._groups = new Map();
    this._subgroups = new Map();
    this._availableCars = new AvailableCars();
    this._workShift = new WorkShift();
  }

  public getEmployee(id: number): Employee {
    if (this.employees.has(id)) {
      return this.employees.get(id) as Employee;
    }
    throw new Error("Employee " + id + " unknown.");
  }
  public sortedEmployees(): Array<number> {
    const employees = Array.from(this.employees.values());

    employees.sort((employee1, employee2) => {
      const idSubgroup1 = employee1.subgroupId;
      const idSubgroup2 = employee2.subgroupId;

      if (!idSubgroup1) {
        return -1;
      }
      if (!idSubgroup2) {
        return 1;
      }
      if (idSubgroup1 != idSubgroup2) {
        return idSubgroup1 - idSubgroup2;
      }
      const subgroup1 = this.subgroups.get(idSubgroup1);
      const subgroup2 = this.subgroups.get(idSubgroup2);
      let idGroup1 = 0;
      if (subgroup1) {
        idGroup1 = subgroup1.parent;
      }
      let idGroup2 = 0;
      if (subgroup2) {
        idGroup2 = subgroup2.parent;
      }
      if (idGroup1 != idGroup2) {
        return idGroup1 - idGroup2;
      }
      return employee1.id - employee2.id;
    });
    return employees.map(e => e.id);
  }
  public getSubgroup(employeeId: number): Subgroup | undefined {
    const subgroupId = this.getEmployee(employeeId).subgroupId;
    if (subgroupId) {
      return this.subgroups.get(subgroupId);
    }
    return undefined;
  }
  public getGroup(employeeId: number): Group | undefined {
    const subgroup = this.getSubgroup(employeeId);
    if (subgroup && subgroup.parent) {
      return this.groups.get(subgroup.parent);
    }
    return undefined;
  }

  public set from(from: Date) {
    this._from = from;
  }
  public get from() {
    return this._from;
  }
  public set to(to: Date) {
    this._to = to;
  }
  public get to() {
    return this._to;
  }
  public set employees(employees: Map<number, Employee>) {
    this._employees = employees;
  }
  public get employees() {
    return this._employees;
  }
  public set availableCars(availableCars: AvailableCars) {
    this._availableCars = availableCars;
  }
  public get availableCars() {
    return this._availableCars;
  }
  public set workShift(workShift: WorkShift) {
    this._workShift = workShift;
  }
  public get workShift() {
    return this._workShift;
  }
  public set groups(groups: Map<number, Group>) {
    this._groups = groups;
  }
  public get groups() {
    return this._groups;
  }
  public set subgroups(subgroups: Map<number, Subgroup>) {
    this._subgroups = subgroups;
  }
  public get subgroups() {
    return this._subgroups;
  }
}
