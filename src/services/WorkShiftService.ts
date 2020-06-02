import { WorkContext } from "../models/WorkContext";
import { factory } from "../utils/ConfigLog4j";
import { Action } from "@/models/Action";

export class WorkShiftService {
  private logger = factory.getLogger("services.WorkShiftService");

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
