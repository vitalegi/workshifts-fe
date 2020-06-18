import { factory } from "@/utils/ConfigLog4j";
import { WorkContext } from "@/models/WorkContext";
import { stats } from "@/utils/Decorators";
import { ApplicationContext } from "./ApplicationContext";
import { Action } from "@/models/Action";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";

const logger = factory.getLogger("services.OptimizeShiftsService");

class Variable {
  public name = "";
  public min = 0;
  public max = 0;

  constructor(name: string, min: number, max: number) {
    this.name = name;
    this.min = min;
    this.max = max;
  }
}

class Coefficient {
  public variable: Variable;
  public coefficient: number;

  constructor(variable: Variable, coefficient: number) {
    this.variable = variable;
    this.coefficient = coefficient;
  }
}

class Constraint {
  public context: OptimizationContext;
  public name = "";
  public min = 0;
  public max = 0;
  public coefficients: Array<Coefficient>;

  constructor(
    context: OptimizationContext,
    name: string,
    min: number,
    max: number,
    coefficients: Array<Coefficient> = []
  ) {
    this.context = context;
    this.name = name;
    this.min = min;
    this.max = max;
    this.coefficients = coefficients;
  }

  public addCoefficient(variable: string, coefficient: number): Constraint {
    if (this.coefficients.filter(c => c.variable.name == variable).length > 0) {
      throw new Error(
        `Cannot add coefficient ${variable} to constraint ${name}. Coefficient already exists.`
      );
    }
    this.coefficients.push(
      new Coefficient(this.context.getVariable(variable), coefficient)
    );
    return this;
  }
}

class OptimizationContext {
  protected variables = new Map<string, Variable>();
  protected constraints = new Map<string, Constraint>();

  public addVariable(name: string, min: number, max: number): Variable {
    logger.debug(() => `addVariable [${name}] ${min}/${max}`);
    if (this.variables.has(name)) {
      throw new Error(`Variable ${name} already exists.`);
    }
    const v = new Variable(name, min, max);
    this.variables.set(name, v);
    return v;
  }
  public addConstraint(
    name: string,
    min: number,
    max: number,
    coefficients: Array<Coefficient> = []
  ): Constraint {
    logger.debug(() => `addConstraint [${name}] ${min}/${max}`);
    if (this.constraints.has(name)) {
      throw new Error(`Constraint [${name}] already exists.`);
    }
    const c = new Constraint(this, name, min, max, coefficients);
    this.constraints.set(name, c);
    return c;
  }
  public getVariable(name: string): Variable {
    const v = this.variables.get(name);
    if (v) {
      return v;
    }
    throw new Error(`Variable [${name}] doesn't exist.`);
  }
  public getConstraint(name: string): Constraint {
    const c = this.constraints.get(name);
    if (c) {
      return c;
    }
    throw new Error(`Constraint [${name}] doesn't exist.`);
  }
  public hasVariable(name: string): boolean {
    return this.variables.has(name);
  }
  public hasConstraint(name: string): boolean {
    return this.constraints.has(name);
  }
  public variableNames(): Array<string> {
    return Array.from(this.variables.entries()).map(e => e[0]);
  }
  public constraintNames(): Array<string> {
    return Array.from(this.constraints.entries()).map(e => e[0]);
  }
  public variableValues(): Array<Variable> {
    return Array.from(this.variables.values());
  }
  public constraintValues(): Array<Constraint> {
    return Array.from(this.constraints.values());
  }
}

export class OptimizationContextSerializer {
  public serialize(context: OptimizationContext): object {
    const outCtx = {
      variables: context.variableValues().map(v => this.serializeVariable(v)),
      constraints: context
        .constraintValues()
        .map(c => this.serializeConstraint(c))
    };
    return outCtx;
  }

  protected serializeVariable(variable: Variable): object {
    return {
      name: variable.name,
      max: variable.max,
      min: variable.min
    };
  }
  protected serializeConstraint(constraint: Constraint): object {
    return {
      name: constraint.name,
      max: constraint.max,
      min: constraint.min,
      coefficients: constraint.coefficients.map(c =>
        this.serializeCoefficient(c)
      )
    };
  }
  protected serializeCoefficient(coefficient: Coefficient): object {
    const obj = this.serializeVariable(coefficient.variable);
    (obj as any).coefficient = coefficient.coefficient;
    return obj;
  }
}

class OptimizeUtil {
  protected dateService = ApplicationContext.getInstance().getDateService();
  protected workShiftService = ApplicationContext.getInstance().getWorkShiftService();
  protected actionService = ApplicationContext.getInstance().getActionService();
  protected weekConstraintService = ApplicationContext.getInstance().getWeekConstraintService();

  protected format(date: Date): string {
    const dayOfWeek = this.dateService.getDayOfWeekName(
      this.dateService.getDayOfWeek(date)
    );
    return this.dateService.format(date) + "_" + dayOfWeek;
  }
  protected variable(employeeId: number, date: Date, action: Action) {
    const dateFormatted = this.format(date);
    const actionName = this.actionService.getActionName(action);
    return `${employeeId}_${dateFormatted}_${actionName}`;
  }

  protected oneActivityPerDay(employeeId: number, date: Date): string {
    return `${employeeId}_${this.format(date)}_one_activity_per_day`;
  }

  protected employeeWeeklyTotActivities(
    employeeId: number,
    week: Array<Date>
  ): string {
    return `${employeeId}_${this.format(week[0])}_tot_activities_per_week`;
  }
  protected employeeWeeklyMorningActivities(
    employeeId: number,
    week: Array<Date>
  ): string {
    return `${employeeId}_${this.format(week[0])}_morning_activities_per_week`;
  }
  protected employeeWeeklyAfternoonActivities(
    employeeId: number,
    week: Array<Date>
  ): string {
    return `${employeeId}_${this.format(
      week[0]
    )}_afternoon_activities_per_week`;
  }
  protected groupDailyActivities(
    type: string,
    groupId: number,
    date: Date,
    action: Action
  ): string {
    const actionName = this.actionService.getActionName(action);
    return `${type}_${groupId}_${this.format(date)}_${actionName}`;
  }
  protected carsDailyActivities(date: Date, action: Action) {
    const actionName = this.actionService.getActionName(action);
    return `cars_${this.format(date)}_${actionName}`;
  }
  protected constraintToString(constraint: Constraint): string {
    const coefficients = constraint.coefficients
      .map(c => `${c.variable.name} [${c.coefficient}]`)
      .reduce((prev, curr) => prev + "\n -- " + curr, "");
    return `${constraint.name}, min/max: ${constraint.min}/${constraint.max}. coefficients:${coefficients}`;
  }
}

class EmployeeVariable extends OptimizeUtil {
  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    employeeId: number,
    date: Date
  ): void {
    logger.debug(
      () =>
        `EmployeeVariable employeeId[${employeeId}] date[${this.dateService.format(
          date
        )}]`
    );
    const action = this.workShiftService.getAction(context, employeeId, date);
    if (action == Action.IDLE) {
      opt.addVariable(this.variable(employeeId, date, Action.MORNING), 0, 1);
      opt.addVariable(this.variable(employeeId, date, Action.AFTERNOON), 0, 1);
      opt.addVariable(this.variable(employeeId, date, Action.AWAY), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.IDLE), 0, 1);
    }
    if (action == Action.MORNING) {
      opt.addVariable(this.variable(employeeId, date, Action.MORNING), 1, 1);
      opt.addVariable(this.variable(employeeId, date, Action.AFTERNOON), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.AWAY), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.IDLE), 0, 0);
    }
    if (action == Action.AFTERNOON) {
      opt.addVariable(this.variable(employeeId, date, Action.MORNING), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.AFTERNOON), 1, 1);
      opt.addVariable(this.variable(employeeId, date, Action.AWAY), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.IDLE), 0, 0);
    }
    if (action == Action.AWAY) {
      opt.addVariable(this.variable(employeeId, date, Action.MORNING), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.AFTERNOON), 0, 0);
      opt.addVariable(this.variable(employeeId, date, Action.AWAY), 1, 1);
      opt.addVariable(this.variable(employeeId, date, Action.IDLE), 0, 0);
    }
  }
}

class EmployeeDailyConstraint extends OptimizeUtil {
  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    employeeId: number,
    date: Date
  ): void {
    logger.debug(
      () =>
        `EmployeeDailyConstraint employeeId[${employeeId}] date[${this.dateService.format(
          date
        )}]`
    );
    const constraint = opt.addConstraint(
      this.oneActivityPerDay(employeeId, date),
      0,
      1
    );
    constraint
      .addCoefficient(this.variable(employeeId, date, Action.MORNING), 1)
      .addCoefficient(this.variable(employeeId, date, Action.AFTERNOON), 1)
      .addCoefficient(this.variable(employeeId, date, Action.AWAY), 1)
      .addCoefficient(this.variable(employeeId, date, Action.IDLE), 1);

    logger.debug(
      () =>
        `EmployeeDailyConstraint employeeId[${employeeId}] date[${this.dateService.format(
          date
        )}] ==> ${this.constraintToString(constraint)}`
    );
  }
}
class EmployeeWeeklyTotConstraint extends OptimizeUtil {
  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    employeeId: number,
    week: Array<Date>
  ): void {
    logger.debug(
      () =>
        `EmployeeWeeklyTotConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}]`
    );
    const expectedTot = this.workShiftService.getExpectedEmployeeTotShiftsInWeek(
      employeeId,
      week[0],
      context
    );
    const tot = opt.addConstraint(
      this.employeeWeeklyTotActivities(employeeId, week),
      0,
      expectedTot
    );
    week.forEach(day => {
      tot.addCoefficient(this.variable(employeeId, day, Action.MORNING), 1);
      tot.addCoefficient(this.variable(employeeId, day, Action.AFTERNOON), 1);
    });
    logger.debug(
      () =>
        `EmployeeWeeklyTotConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}] ==> ${this.constraintToString(tot)}`
    );
  }
}

class EmployeeWeeklyMorningsConstraint extends OptimizeUtil {
  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    employeeId: number,
    week: Array<Date>
  ): void {
    logger.debug(
      () =>
        `EmployeeWeeklyMorningsConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}]`
    );
    const expectedMornings = this.workShiftService.getExpectedEmployeeMorningShiftsInWeek(
      employeeId,
      week[0],
      context
    );
    const morning = opt.addConstraint(
      this.employeeWeeklyMorningActivities(employeeId, week),
      0,
      expectedMornings
    );
    week.forEach(day => {
      morning.addCoefficient(this.variable(employeeId, day, Action.MORNING), 1);
    });
    logger.debug(
      () =>
        `EmployeeWeeklyMorningsConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}] ==> ${this.constraintToString(morning)}`
    );
  }
}

class EmployeeWeeklyAfternoonsConstraint extends OptimizeUtil {
  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    employeeId: number,
    week: Array<Date>
  ): void {
    logger.debug(
      () =>
        `EmployeeWeeklyAfternoonsConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}]`
    );
    const expectedAfternoons = this.workShiftService.getExpectedEmployeeAfternoonShiftsInWeek(
      employeeId,
      week[0],
      context
    );
    const afternoon = opt.addConstraint(
      this.employeeWeeklyAfternoonActivities(employeeId, week),
      0,
      expectedAfternoons
    );
    week.forEach(day => {
      afternoon.addCoefficient(
        this.variable(employeeId, day, Action.AFTERNOON),
        1
      );
    });
    logger.debug(
      () =>
        `EmployeeWeeklyAfternoonsConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}] ==> ${this.constraintToString(afternoon)}`
    );
  }
}

class CarsDailyConstraint extends OptimizeUtil {
  private _action: Action;

  constructor(action: Action) {
    super();
    this._action = action;
  }
  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    date: Date
  ): void {
    logger.debug(
      () =>
        `CarsDailyConstraint date[${this.dateService.format(
          date
        )}] action[${this.actionService.getActionName(this._action)}]`
    );
    const expected = context.availableCars.total;

    const constraint = opt.addConstraint(
      this.carsDailyActivities(date, this._action),
      0,
      expected
    );
    const employees = Array.from(context.employees.values());

    employees
      .map(e => e.id)
      .forEach(employeeId => {
        constraint.addCoefficient(
          this.variable(employeeId, date, this._action),
          1
        );
      });
    logger.debug(
      () =>
        `CarsDailyConstraint date[${this.dateService.format(
          date
        )}] action[${this.actionService.getActionName(
          this._action
        )}] ==> ${this.constraintToString(constraint)}`
    );
  }
}

abstract class AbstractGroupDailyConstraint extends OptimizeUtil {
  private _action: Action;

  constructor(action: Action) {
    super();
    this._action = action;
  }

  public apply(
    context: WorkContext,
    opt: OptimizationContext,
    groupId: number,
    date: Date
  ): void {
    const employeeIds = this.getEmployeeIdsInGroup(context, groupId);
    const group = this.getGroup(context, groupId);
    logger.debug(
      () =>
        `AbstractGroupDailyConstraint groupId[${groupId}][${
          group.name
        }] dates[${this.dateService.format(date)}] ${employeeIds.map(
          id => `employeeId[${id}]`
        )}`
    );
    const expectedMin = this.getExpectedMin(group, date);
    const constraint = opt.addConstraint(
      this.getConstraintName(groupId, date, this._action),
      expectedMin,
      0
    );
    employeeIds.forEach(employeeId => {
      constraint.addCoefficient(
        this.variable(employeeId, date, this._action),
        1
      );
    });
    logger.debug(
      () =>
        `AbstractGroupDailyConstraint groupId[${groupId}][${
          group.name
        }] dates[${this.dateService.format(date)}] ${employeeIds.map(
          id => `employeeId[${id}]`
        )} ==> ${this.constraintToString(constraint)}`
    );
  }

  protected abstract getEmployeeIdsInGroup(
    context: WorkContext,
    groupId: number
  ): Array<number>;

  protected abstract getGroup(context: WorkContext, groupId: number): Group;

  protected abstract getConstraintName(
    groupId: number,
    date: Date,
    action: Action
  ): string;

  protected getExpectedMin(group: Group, date: Date): number {
    const dayOfWeek = this.dateService.getDayOfWeek(date);
    return (
      this.weekConstraintService.getMinValue(
        group.constraints,
        dayOfWeek,
        this._action
      ) || 0
    );
  }
}
class GroupDailyConstraint extends AbstractGroupDailyConstraint {
  protected getEmployeeIdsInGroup(
    context: WorkContext,
    groupId: number
  ): number[] {
    return Array.from(context.employees.values())
      .map(employee => employee.id)
      .filter(
        employeeId => context.getGroupByEmployee(employeeId)?.id == groupId
      );
  }
  protected getGroup(context: WorkContext, groupId: number): Group {
    const group = context.getGroupById(groupId);
    if (group) {
      return group;
    }
    throw new Error(`Group ${groupId} doesn't exist`);
  }
  protected getConstraintName(
    groupId: number,
    date: Date,
    action: Action
  ): string {
    return super.groupDailyActivities("GROUP", groupId, date, action);
  }
}
class SubgroupDailyConstraint extends AbstractGroupDailyConstraint {
  protected getEmployeeIdsInGroup(
    context: WorkContext,
    groupId: number
  ): number[] {
    return Array.from(context.employees.values())
      .map(employee => employee.id)
      .filter(
        employeeId => context.getSubgroupByEmployee(employeeId)?.id == groupId
      );
  }
  protected getGroup(context: WorkContext, groupId: number): Group {
    const group = context.getSubgroupById(groupId);
    if (group) {
      return group;
    }
    throw new Error(`Subgroup ${groupId} doesn't exist`);
  }
  protected getConstraintName(
    groupId: number,
    date: Date,
    action: Action
  ): string {
    return super.groupDailyActivities("SUBGROUP", groupId, date, action);
  }
}
export class OptimizeShiftsService extends OptimizeUtil {
  @stats("OptimizeShiftsService")
  public optimize(context: WorkContext): OptimizationContext {
    const opt = new OptimizationContext();

    const range = this.range(context.date);
    const weeks = this.dateService.getWeeks(range);

    range.forEach(date => {
      context.sortedEmployees().forEach(employeeId => {
        new EmployeeVariable().apply(context, opt, employeeId, date);
        new EmployeeDailyConstraint().apply(context, opt, employeeId, date);
      });
    });

    weeks.forEach(week => {
      context.sortedEmployees().forEach(employeeId => {
        new EmployeeWeeklyTotConstraint().apply(context, opt, employeeId, week);
        new EmployeeWeeklyMorningsConstraint().apply(
          context,
          opt,
          employeeId,
          week
        );
        new EmployeeWeeklyAfternoonsConstraint().apply(
          context,
          opt,
          employeeId,
          week
        );
      });
    });

    const groupsDailyConstraints = [
      new GroupDailyConstraint(Action.MORNING),
      new GroupDailyConstraint(Action.AFTERNOON)
    ];
    range.forEach(date => {
      context.groups.forEach(group => {
        groupsDailyConstraints.forEach(constraint => {
          constraint.apply(context, opt, group.id, date);
        });
      });
    });

    const subgroupsDailyConstraints = [
      new SubgroupDailyConstraint(Action.MORNING),
      new SubgroupDailyConstraint(Action.AFTERNOON)
    ];

    range.forEach(date => {
      context.subgroups.forEach(group => {
        subgroupsDailyConstraints.forEach(constraint => {
          constraint.apply(context, opt, group.id, date);
        });
      });
    });

    const carsConstraints = [
      new CarsDailyConstraint(Action.MORNING),
      new CarsDailyConstraint(Action.AFTERNOON)
    ];
    range.forEach(date => {
      carsConstraints.forEach(constraint => {
        constraint.apply(context, opt, date);
      });
    });

    if (logger.isDebugEnabled()) {
      opt.constraintNames().forEach(constraintName => {
        const constraint = opt.getConstraint(constraintName);
        const coefficients = constraint.coefficients
          .map(c => `${c.variable.name} [${c.coefficient}]`)
          .reduce((prev, curr) => prev + "\n -- " + curr, "");
        logger.debug(
          () =>
            `C: ${constraint.name}, min/max: ${constraint.min}/${constraint.max}. coefficients:${coefficients}`
        );
      });
    }
    logger.info(
      () =>
        `Optimize ${opt.variableNames().length} variables and ${
          opt.constraintNames().length
        } constraints`
    );
    return opt;
  }
  protected range(date: Date): Array<Date> {
    return this.dateService.range(this.rangeStart(date), this.rangeEnd(date));
  }
  protected rangeStart(date: Date): Date {
    return this.workShiftService.rangeStart(date);
  }
  protected rangeEnd(date: Date): Date {
    return this.workShiftService.rangeEnd(date);
  }
}
