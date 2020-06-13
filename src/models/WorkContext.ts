import { Employee } from "./Employee";
import { AvailableCars } from "./AvailableCars";
import { Subgroup } from "./Subgroup";
import { Group } from "./Group";
import { Shift } from "./Shift";
import { ArrayUtil } from "@/utils/ArrayUtil";
import { ApplicationContext } from '@/services/ApplicationContext';

export class WorkContext {
  private _date: Date;
  private _employees: Map<number, Employee>;
  private _groups: Map<number, Group>;
  private _subgroups: Map<number, Subgroup>;
  private _availableCars: AvailableCars;

  private _workShifts: Array<Shift>;
  public _workShiftsMap = new Map<number, Map<string, string>>();

  public constructor() {
    this._date = new Date();
    this._employees = new Map();
    this._groups = new Map();
    this._subgroups = new Map();
    this._availableCars = new AvailableCars();
    this._workShifts = new Array<Shift>();
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
    return employees.map((e) => e.id);
  }
  public getSubgroupByEmployee(employeeId: number): Subgroup | undefined {
    const subgroupId = this.getEmployee(employeeId).subgroupId;
    if (subgroupId) {
      return this.getSubgroupById(subgroupId);
    }
    return undefined;
  }
  public getSubgroupById(subgroupId: number): Subgroup | undefined {
    return this.subgroups.get(subgroupId);
  }
  public getGroupByEmployee(employeeId: number): Group | undefined {
    const subgroup = this.getSubgroupByEmployee(employeeId);
    if (subgroup && subgroup.parent) {
      return this.groups.get(subgroup.parent);
    }
    return undefined;
  }
  public getGroupById(groupId: number): Group | undefined {
    return this.groups.get(groupId);
  }

  public setShift(employeeId: number, date: Date, value: string): void {
    const dateService = ApplicationContext.getInstance().getDateService();
    ArrayUtil.delete(
      this.workShifts,
      (s) =>
        s.employeeId == employeeId && dateService.format(s.date) == dateService.format(date)
    );
    this.workShifts.push(new Shift(employeeId, date, value));

    const map = this._workShiftsMap;
    if (!map.has(employeeId)) {
      map.set(employeeId, new Map<string, string>());
    }
    map.get(employeeId)?.set(dateService.format(date), value);
  }

  public getShift(employeeId: number, date: Date, defaultValue: string): string {
    // make vue aware of the update
    this.workShifts.length;

    const dateService = ApplicationContext.getInstance().getDateService();
    const value = this._workShiftsMap.get(employeeId)?.get(dateService.format(date));
    if (value) {
      return value;
    }
    return defaultValue;
  }

  public deleteShifts():void {
    this._workShiftsMap = new Map<number, Map<string, string>>();
    this.workShifts.splice(0, this.workShifts.length);
  }

  public set date(date: Date) {
    this._date = date;
  }
  public get date() {
    return this._date;
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
  public set workShifts(workShifts: Array<Shift>) {
    this._workShifts = workShifts;
  }
  public get workShifts() {
    return this._workShifts;
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
