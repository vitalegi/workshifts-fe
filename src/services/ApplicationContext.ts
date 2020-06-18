import { ActionService } from "@/services/ActionService";
import { DateService } from "@/services/DateService";
import { WorkShiftService } from "@/services/WorkShiftService";
import { ShiftValidationService } from "@/services/ShiftValidationService";
import { WeekConstraintService } from "@/services/WeekConstraintService";
import { OptimizeShiftsService } from "@/services/OptimizeShiftsService";

export class ApplicationContext {
  private _instances: any;

  private static _context: ApplicationContext;

  private constructor() {
    this._instances = {};
  }

  public static getInstance() {
    if (this._context == null) {
      this._context = new ApplicationContext();
    }
    return this._context;
  }

  public getActionService(): ActionService {
    return this.getService("ActionService", () => new ActionService());
  }

  public getDateService(): DateService {
    return this.getService("DateService", () => new DateService());
  }

  public getWorkShiftService(): WorkShiftService {
    return this.getService("WorkShiftService", () => new WorkShiftService());
  }

  public getShiftValidationService(): ShiftValidationService {
    return this.getService(
      "ShiftValidationService",
      () => new ShiftValidationService()
    );
  }
  public getOptimizeShiftsService(): OptimizeShiftsService {
    return this.getService(
      "OptimizeShiftsService",
      () => new OptimizeShiftsService()
    );
  }

  public getWeekConstraintService(): WeekConstraintService {
    return this.getService(
      "WeekConstraintService",
      () => new WeekConstraintService()
    );
  }

  private getService<T>(key: string, initializr: () => T): T {
    if (!this._instances[key]) {
      const value = initializr();
      this._instances[key] = value;
    }
    return this._instances[key];
  }
}
