import { WorkContext } from "../models/WorkContext";
import { factory } from "../utils/ConfigLog4j";
import { ApplicationContext } from "./ApplicationContext";
import { Action } from "@/models/Action";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { stats } from "@/utils/Decorators";

abstract class AbstractShiftValidator {
  protected dateService = ApplicationContext.getInstance().getDateService();

  public abstract errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string>;

  public isValid(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): boolean {
    return this.errors(employeeId, day, context).length == 0;
  }

  public hasErrors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): boolean {
    return !this.isValid(employeeId, day, context);
  }
}

class TotalShiftsPerWeek extends AbstractShiftValidator {
  private logger = factory.getLogger("services.TotalShiftsPerWeek");

  @stats("ShiftValidationService.TotalShiftsPerWeek")
  public errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    const errors = new Array<string>();
    if (employeeId == null) {
      return errors;
    }
    const workShiftService = ApplicationContext.getInstance().getWorkShiftService();
    const range = this.dateService.getWeek(day);

    const tot =
      workShiftService.countByEmployeesDatesAction(
        [employeeId],
        range,
        Action.MORNING,
        context
      ) +
      workShiftService.countByEmployeesDatesAction(
        [employeeId],
        range,
        Action.AFTERNOON,
        context
      ) +
      workShiftService.countByEmployeesDatesAction(
        [employeeId],
        range,
        Action.AWAY,
        context
      );
    const employee = context.getEmployee(employeeId);
    if (tot != employee.totWeekShifts) {
      errors.push(
        `${employee.name} dovrebbe lavorare ${employee.totWeekShifts} turni in una settimana, presenti ${tot}`
      );
    }
    return errors;
  }
}

class MaxShiftByTypePerWeek extends AbstractShiftValidator {
  private logger = factory.getLogger("services.MinShiftPerWeek");

  @stats("ShiftValidationService.MaxShiftByTypePerWeek")
  public errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    const errors = new Array<string>();
    if (employeeId == null) {
      return errors;
    }
    const workShiftService = ApplicationContext.getInstance().getWorkShiftService();
    const range = this.dateService.getWeek(day);

    const employee = context.getEmployee(employeeId);
    const expectedMornings = employee.maxWeekMornings;
    const actualMornings = workShiftService.countByEmployeesDatesAction(
      [employeeId],
      range,
      Action.MORNING,
      context
    );
    const expectedAfternoons = employee.maxWeekAfternoons;
    const actualAfternoons = workShiftService.countByEmployeesDatesAction(
      [employeeId],
      range,
      Action.AFTERNOON,
      context
    );
    if (expectedMornings < actualMornings) {
      errors.push(
        `${employee.name} dovrebbe lavorare al massimo ${expectedMornings} mattine la settimana, presenti ${actualMornings}`
      );
    }
    if (expectedAfternoons < actualAfternoons) {
      errors.push(
        `${employee.name} dovrebbe lavorare al massimo ${expectedAfternoons} pomeriggi la settimana, presenti ${actualAfternoons}`
      );
    }
    return errors;
  }
}

class MaxCarsPerShift extends AbstractShiftValidator {
  private logger = factory.getLogger("services.MaxCarsPerShift");
  private action: Action;
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();

  public constructor(action: Action) {
    super();
    this.action = action;
  }

  @stats("ShiftValidationService.MaxCarsPerShift")
  public errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    const errors = new Array<string>();

    const employees = Array.from(context.employees.values()).map(
      (employee) => employee.id
    );

    const tot = this.workShiftService.countByEmployeesDatesAction(
      employees,
      [day],
      this.action,
      context
    );
    if (tot > context.availableCars.total) {
      if (this.action == Action.MORNING) {
        errors.push(
          `Disponibili ${context.availableCars.total} auto al mattino, assegnate ${tot}.`
        );
      }
      if (this.action == Action.AFTERNOON) {
        errors.push(
          `Disponibili ${context.availableCars.total} auto al pomeriggio, assegnate ${tot}.`
        );
      }
    }
    return errors;
  }
}

abstract class AbstractMinShiftsPerGroup extends AbstractShiftValidator {
  protected logger = factory.getLogger("services.AbstractMinShiftsPerGroup");
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();

  public errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    const errors = new Array<string>();
    if (employeeId == null) {
      return errors;
    }
    const employee = context.getEmployee(employeeId);
    const targetGroup = this.getGroup(employee, context);
    const dayOfWeek = this.dateService.getDayOfWeek(day);
    if (typeof targetGroup === "undefined") {
      return errors;
    }

    const employeeIdsInTargetGroup = Array.from(context.employees.values())
      .filter(
        (employeeId) => this.getGroup(employee, context)?.id == targetGroup.id
      )
      .map((employee) => employee.id);

    const expectedMinMornings = targetGroup.constraints.getMin(
      dayOfWeek,
      Action.MORNING
    );
    const actualMornings = this.workShiftService.countByEmployeesDatesAction(
      employeeIdsInTargetGroup,
      [day],
      Action.MORNING,
      context
    );
    const expectedMinAfternoons = targetGroup.constraints.getMin(
      dayOfWeek,
      Action.AFTERNOON
    );
    const actualAfternoons = this.workShiftService.countByEmployeesDatesAction(
      employeeIdsInTargetGroup,
      [day],
      Action.AFTERNOON,
      context
    );
    const action = context.workShift.getAction(employee, day);
    if (expectedMinMornings > actualMornings) {
      errors.push(
        `Nel gruppo ${targetGroup.name} al mattino sono richieste almeno ${expectedMinMornings} risorse, presenti ${actualMornings}`
      );
    }
    if (expectedMinAfternoons > actualAfternoons) {
      errors.push(
        `Nel gruppo ${targetGroup.name} al pomeriggio sono richieste almeno ${expectedMinAfternoons} risorse, presenti ${actualAfternoons}`
      );
    }
    return errors;
  }

  protected abstract getGroup(
    employee: Employee,
    context: WorkContext
  ): Group | undefined;
}

class MinShiftsPerGroup extends AbstractMinShiftsPerGroup {

  @stats("ShiftValidationService.MinShiftsPerGroup")
  public errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    return super.errors(employeeId, day, context);
  }
  protected getGroup(
    employee: Employee,
    context: WorkContext
  ): Group | undefined {
    return context.getGroup(employee.id);
  }
}
class MinShiftsPerSubGroup extends AbstractMinShiftsPerGroup {
  
  @stats("ShiftValidationService.MinShiftsPerSubGroup")
  public errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    return super.errors(employeeId, day, context);
  }
  protected getGroup(
    employee: Employee,
    context: WorkContext
  ): Group | undefined {
    return context.getSubgroup(employee.id);
  }
}

export class ShiftValidationService {
  private logger = factory.getLogger("services.ShiftValidationService");
  protected dateService = ApplicationContext.getInstance().getDateService();

  public getEmployeeErrors(
    employeeId: number,
    day: Date,
    context: WorkContext
  ): Array<string> {
    return this.errors(employeeId, day, context, [
      new TotalShiftsPerWeek(),
      new MaxShiftByTypePerWeek(),
      new MaxCarsPerShift(Action.MORNING),
      new MaxCarsPerShift(Action.AFTERNOON),
      new MinShiftsPerGroup(),
      new MinShiftsPerSubGroup(),
    ]);
  }

  public getCarsErrors(
    day: Date,
    action: Action,
    context: WorkContext
  ): Array<string> {
    return this.errors(null, day, context, [new MaxCarsPerShift(action)]);
  }

  protected errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext,
    validators: Array<AbstractShiftValidator>
  ): Array<string> {
    const errors = validators.flatMap((validator) =>
      validator.errors(employeeId, day, context)
    );
    this.logger.debug(
      () =>
        `Validate employee ${employeeId} day ${this.dateService.format(
          day
        )} errors ${errors}`
    );
    return errors;
  }
}
