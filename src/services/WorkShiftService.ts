import { WorkContext } from "../models/WorkContext";
import { factory } from "../utils/ConfigLog4j";
import { Action } from "@/models/Action";
import { stats, cacheable } from "@/utils/Decorators";
import { CacheConfigFactory } from "@/utils/Cache";

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
    return employees.flatMap(employee => {
      const e = context.getEmployee(employee);
      return dates
        .map(date => context.workShift.getAction(e, date))
        .filter(a => a == action);
    }).length;
  }
}
