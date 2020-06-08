import { WorkContext } from "@/models/WorkContext";
import { ApplicationContext } from "@/services/ApplicationContext";
import { WorkContextIO } from "./WorkContextIO";
import { Shift } from "@/models/Shift";

export class ContextSerializer {
  private dateService = ApplicationContext.getInstance().getDateService();
  private actionService = ApplicationContext.getInstance().getActionService();

  public serializeContext(
    context: WorkContext,
    from: Date,
    to: Date
  ): WorkContextIO {
    const outCtx = new WorkContextIO();
    outCtx.date = this.dateService.format(context.date);
    outCtx.employees = Array.from(context.employees.values()).map((e) =>
      e.clone()
    );
    outCtx.groups = Array.from(context.groups.values()).map((g) => g.clone());
    outCtx.subgroups = Array.from(context.subgroups.values()).map((g) =>
      g.clone()
    );
    outCtx.availableCars = context.availableCars.total;
    outCtx.shifts = Array.from(context.workShifts.values()).map((s) =>
      s.clone()
    );
    return outCtx;
  }
}
