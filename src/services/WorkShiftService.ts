import { WorkContext } from "../models/WorkContext";
import { factory } from "../utils/ConfigLog4j";
import { Action } from "@/models/Action";
import { stats, cacheable } from "@/utils/Decorators";
import { CacheConfigFactory } from "@/utils/Cache";
import { ApplicationContext } from "./ApplicationContext";
import { Shift } from "@/models/Shift";
import { Employee } from "@/models/Employee";

export class WorkShiftService {
  private logger = factory.getLogger("services.WorkShiftService");

  private actionService = ApplicationContext.getInstance().getActionService();
  private dateService = ApplicationContext.getInstance().getDateService();

  @stats("WorkShiftService.cached")
  @cacheable(
    "WorkShiftService.countByEmployeesDatesAction",
    (args: any[]) =>
      args[0] + "_" + args[1].map((d: any) => d.toISOString()) + "_" + args[2],
    new CacheConfigFactory().maxSize(2000).build()
  )
  @stats("WorkShiftService.raw")
  public countByEmployeesDatesAction(
    employees: Array<number>,
    dates: Array<Date>,
    action: Action,
    context: WorkContext
  ): number {
    return employees.flatMap((employeeId) => {
      return dates
        .map((date) => this.getAction(context, employeeId, date))
        .filter((a) => a == action);
    }).length;
  }

  public countByEmployeesDatesActions(
    employees: Array<number>,
    dates: Array<Date>,
    actions: Array<Action>,
    context: WorkContext
  ): number {
    return actions
      .map((action) =>
        this.countByEmployeesDatesAction(employees, dates, action, context)
      )
      .reduce((prev, curr) => prev + curr);
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
    context: WorkContext,
    employeeId: number,
    date: Date
  ): Action {
    const label = context.getShift(
      employeeId,
      date,
      this.actionService.getDefaultLabel()
    );
    return this.actionService.getAction(label);
  }

  rangeStart(date: Date): Date {
    const startOfMonth = this.dateService.getStartOfMonth(date);
    return this.dateService.getStartOfWeek(startOfMonth);
  }

  rangeEnd(date: Date): Date {
    const endOfMonth = this.dateService.getEndOfMonth(date);
    return this.dateService.getEndOfWeek(endOfMonth);
  }
}
