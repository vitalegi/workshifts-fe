import { WorkContext } from "../models/WorkContext";
import { factory } from "../utils/ConfigLog4j";
import { Action } from "@/models/Action";
import { stats, cacheable } from "@/utils/Decorators";
import { CacheConfigFactory } from "@/utils/Cache";
import { ContextSerializer } from "@/transformer/ContextSerializer";
import { ApplicationContext } from "./ApplicationContext";
import { Shift } from "@/models/Shift";
import { Employee } from "@/models/Employee";

export class WorkShiftService {
  private logger = factory.getLogger("services.WorkShiftService");

  @stats("WorkShiftService.cached")
  @cacheable(
    "WorkShiftService.countByEmployeesDatesAction",
    (args: any[]) => args[0] + "_" + args[1] + "_" + args[2],
    new CacheConfigFactory().maxSize(2000).build()
  )
  @stats("WorkShiftService.raw")
  public countByEmployeesDatesAction(
    employees: Array<number>,
    dates: Array<Date>,
    action: Action,
    context: WorkContext
  ): number {
    return employees.flatMap((employee) => {
      const e = context.getEmployee(employee);
      return dates
        .map((date) => this.getAction(context.workShifts, e, date))
        .filter((a) => a == action);
    }).length;
  }

  public getValue(
    shifts: Array<Shift>,
    employee: Employee,
    date: Date
  ): string {
    const filtered = shifts
      .filter((s) => s.employeeId == employee.id)
      .filter((s) => s.date.toISOString() == date.toISOString());
    if (filtered.length == 0) {
      return ApplicationContext.getInstance()
        .getActionService()
        .getDefaultLabel();
    }
    if (filtered.length > 1) {
      throw new Error(
        `Present more than 1 value for ${employee.id}-${date}: ${filtered}`
      );
    }
    return filtered[0].value;
  }

  public hasEntry(
    shifts: Array<Shift>,
    employee: Employee,
    date: Date
  ): boolean {
    return (
      shifts
        .filter((s) => s.employeeId == employee.id)
        .filter((s) => s.date == date).length > 0
    );
  }

  public getAction(
    shifts: Array<Shift>,
    employee: Employee,
    date: Date
  ): Action {
    const label = this.getValue(shifts, employee, date);
    return ApplicationContext.getInstance()
      .getActionService()
      .getAction(label);
  }

  rangeStart(date: Date): Date {
    const dateService = ApplicationContext.getInstance().getDateService();
    const startOfMonth = dateService.getStartOfMonth(date);
    return dateService.getStartOfWeek(startOfMonth);
  }

  rangeEnd(date: Date): Date {
    const dateService = ApplicationContext.getInstance().getDateService();
    const endOfMonth = dateService.getEndOfMonth(date);
    return dateService.getEndOfWeek(endOfMonth);
  }
}
