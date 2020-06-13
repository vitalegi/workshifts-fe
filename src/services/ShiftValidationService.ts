import { WorkContext } from "../models/WorkContext";
import { factory } from "../utils/ConfigLog4j";
import { ApplicationContext } from "./ApplicationContext";
import { Action } from "@/models/Action";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { stats } from "@/utils/Decorators";

abstract class AbstractEmployeeShiftValidator {
  protected dateService = ApplicationContext.getInstance().getDateService();

  public abstract errors(
    employeeId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string>;
}

class TotalShiftsPerWeek extends AbstractEmployeeShiftValidator {
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

class MaxShiftByTypePerWeek extends AbstractEmployeeShiftValidator {
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

class MaxCarsPerShift extends AbstractEmployeeShiftValidator {
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

abstract class AbstractMinShiftsPerGroup {
  protected dateService = ApplicationContext.getInstance().getDateService();
  protected logger = factory.getLogger("services.AbstractMinShiftsPerGroup");
  protected workShiftService = ApplicationContext.getInstance().getWorkShiftService();

  public errors(
    groupId: number | null,
    day: Date,
    context: WorkContext
  ): Array<string> {
    const errors = new Array<string>();
    if (groupId == null) {
      return errors;
    }
    const targetGroup = this.getGroup(groupId, context);
    const dayOfWeek = this.dateService.getDayOfWeek(day);
    if (typeof targetGroup === "undefined") {
      return errors;
    }

    const employeeIdsInTargetGroup = Array.from(context.employees.values())
      .filter(
        (employee) => this.getGroupByEmployee(employee, context)?.id == targetGroup.id
      )
      .map((employee) => employee.id);

    const expectedMinMornings =
      ApplicationContext.getInstance()
        .getWeekConstraintService()
        .getMinValue(targetGroup.constraints, dayOfWeek, Action.MORNING) || 0;
    const actualMornings = this.workShiftService.countByEmployeesDatesAction(
      employeeIdsInTargetGroup,
      [day],
      Action.MORNING,
      context
    );
    const expectedMinAfternoons =
      ApplicationContext.getInstance()
        .getWeekConstraintService()
        .getMinValue(targetGroup.constraints, dayOfWeek, Action.AFTERNOON) || 0;

    const actualAfternoons = this.workShiftService.countByEmployeesDatesAction(
      employeeIdsInTargetGroup,
      [day],
      Action.AFTERNOON,
      context
    );
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
    groupId: number,
    context: WorkContext
  ): Group | undefined;

  protected abstract getGroupByEmployee(
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
    groupId: number,
    context: WorkContext
  ): Group | undefined {
    return context.getGroupById(groupId);
  }

  protected getGroupByEmployee(
    employee: Employee,
    context: WorkContext
  ): Group | undefined {
    return context.getGroupByEmployee(employee.id);
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
    groupId: number,
    context: WorkContext
  ): Group | undefined {
    return context.getSubgroupById(groupId);
  }

  protected getGroupByEmployee(
    employee: Employee,
    context: WorkContext
  ): Group | undefined {
    return context.getSubgroupByEmployee(employee.id);
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
      new MaxCarsPerShift(Action.AFTERNOON)
    ]);
  }

  public getGroupErrors(
    groupId: number,
    day: Date,
    context: WorkContext
  ): Array<string> {
    return this.errors(groupId, day, context, [
      new MinShiftsPerGroup()
    ]);
  }
  
  public getSubgroupErrors(
    groupId: number,
    day: Date,
    context: WorkContext
  ): Array<string> {
    return this.errors(groupId, day, context, [
      new MinShiftsPerSubGroup()
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
