import { factory } from "@/utils/ConfigLog4j";
import { WorkContext } from "@/models/WorkContext";
import { stats } from "@/utils/Decorators";
import { ApplicationContext } from "./ApplicationContext";
import { Action } from "@/models/Action";
import { Employee } from "@/models/Employee";
import { Group } from "@/models/Group";
import { BackendWebService } from "@/utils/WebService";

const logger = factory.getLogger("services.OptimizeShiftsService");

const MAX_INTEGER = 2147483647;

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
class Objective {
  private _name: string;
  private _coefficient: number;

  constructor(name: string, coefficient: number) {
    this._name = name;
    this._coefficient = coefficient;
  }
  public get name() {
    return this._name;
  }
  public get coefficient() {
    return this._coefficient;
  }
}
class SolutionVariable {
  public name = "";
  public value = 0;
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

const constraintToString = (constraint: Constraint) => {
  const coefficients = constraint.coefficients
    .map(c => `${c.variable.name} [${c.coefficient}]`)
    .reduce((prev, curr) => prev + "\n -- " + curr, "");
  return `${constraint.name}, min/max: ${constraint.min}/${constraint.max}. coefficients:${coefficients}`;
};

const format = (date: Date) => {
  const dateService = ApplicationContext.getInstance().getDateService();
  const dayOfWeek = dateService.getDayOfWeekName(
    dateService.getDayOfWeek(date)
  );
  return dateService.format(date) + "_" + dayOfWeek;
};

const variable = (employeeId: number, date: Date, action: Action) => {
  const dateFormatted = format(date);
  const actionName = ApplicationContext.getInstance()
    .getActionService()
    .getActionName(action);
  return `${employeeId}_${dateFormatted}_${actionName}`;
};

class OptimizationContext {
  protected variables = new Map<string, Variable>();
  protected constraints = new Map<string, Constraint>();
  protected objectives = new Array<Objective>();

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
  public addObjectiveCoefficient(variable: string, coefficient: number): void {
    this.objectives.push(new Objective(variable, coefficient));
  }
  public getObjectives() {
    return this.objectives;
  }
}

class OptimizationContextSerializer {
  public serialize(context: OptimizationContext): object {
    const outCtx = {
      variables: context.variableValues().map(v => this.serializeVariable(v)),
      constraints: context
        .constraintValues()
        .map(c => this.serializeConstraint(c)),
      objective: context.getObjectives().map(o => this.serializeObjective(o))
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
  protected serializeObjective(objective: Objective): object {
    return {
      name: objective.name,
      coefficient: objective.coefficient
    };
  }
}

class EmployeeVariable {
  private dateService = ApplicationContext.getInstance().getDateService();
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();

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
      this.addVariable(opt, employeeId, date, Action.MORNING, 0, 1);
      this.addVariable(opt, employeeId, date, Action.AFTERNOON, 0, 1);
      this.addVariable(opt, employeeId, date, Action.AWAY, 0, 0);
      this.addVariable(opt, employeeId, date, Action.IDLE, 0, 1);
    }
    if (action == Action.MORNING) {
      this.addVariable(opt, employeeId, date, Action.MORNING, 1, 1);
      this.addVariable(opt, employeeId, date, Action.AFTERNOON, 0, 0);
      this.addVariable(opt, employeeId, date, Action.AWAY, 0, 0);
      this.addVariable(opt, employeeId, date, Action.IDLE, 0, 0);
    }
    if (action == Action.AFTERNOON) {
      this.addVariable(opt, employeeId, date, Action.MORNING, 0, 0);
      this.addVariable(opt, employeeId, date, Action.AFTERNOON, 1, 1);
      this.addVariable(opt, employeeId, date, Action.AWAY, 0, 0);
      this.addVariable(opt, employeeId, date, Action.IDLE, 0, 0);
    }
    if (action == Action.AWAY) {
      this.addVariable(opt, employeeId, date, Action.MORNING, 0, 0);
      this.addVariable(opt, employeeId, date, Action.AFTERNOON, 0, 0);
      this.addVariable(opt, employeeId, date, Action.AWAY, 1, 1);
      this.addVariable(opt, employeeId, date, Action.IDLE, 0, 0);
    }
  }

  protected addVariable(
    opt: OptimizationContext,
    employeeId: number,
    date: Date,
    action: Action,
    min: number,
    max: number
  ): void {
    const name = variable(employeeId, date, action);
    logger.debug(
      () =>
        `EmployeeVariable employeeId[${employeeId}] date[${this.dateService.format(
          date
        )}] action[${action}] variable[${name}] ${min}/${max}`
    );
    opt.addVariable(name, min, max);
  }
}

class EmployeeDailyConstraint {
  private dateService = ApplicationContext.getInstance().getDateService();

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
      .addCoefficient(variable(employeeId, date, Action.MORNING), 1)
      .addCoefficient(variable(employeeId, date, Action.AFTERNOON), 1)
      .addCoefficient(variable(employeeId, date, Action.AWAY), 1)
      .addCoefficient(variable(employeeId, date, Action.IDLE), 1);

    logger.debug(
      () =>
        `EmployeeDailyConstraint employeeId[${employeeId}] date[${this.dateService.format(
          date
        )}] ==> ${constraintToString(constraint)}`
    );
  }

  protected oneActivityPerDay(employeeId: number, date: Date): string {
    return `${employeeId}_${format(date)}_one_activity_per_day`;
  }
}
class EmployeeWeeklyTotConstraint {
  private dateService = ApplicationContext.getInstance().getDateService();
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();

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
      tot.addCoefficient(variable(employeeId, day, Action.MORNING), 1);
      tot.addCoefficient(variable(employeeId, day, Action.AFTERNOON), 1);
    });
    logger.debug(
      () =>
        `EmployeeWeeklyTotConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}] ==> ${constraintToString(tot)}`
    );
  }
  protected employeeWeeklyTotActivities(
    employeeId: number,
    week: Array<Date>
  ): string {
    return `${employeeId}_${format(week[0])}_tot_activities_per_week`;
  }
}

class EmployeeWeeklyMorningsConstraint {
  private dateService = ApplicationContext.getInstance().getDateService();
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();

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
      morning.addCoefficient(variable(employeeId, day, Action.MORNING), 1);
    });
    logger.debug(
      () =>
        `EmployeeWeeklyMorningsConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}] ==> ${constraintToString(morning)}`
    );
  }
  protected employeeWeeklyMorningActivities(
    employeeId: number,
    week: Array<Date>
  ): string {
    return `${employeeId}_${format(week[0])}_morning_activities_per_week`;
  }
}

class EmployeeWeeklyAfternoonsConstraint {
  private dateService = ApplicationContext.getInstance().getDateService();
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();

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
      afternoon.addCoefficient(variable(employeeId, day, Action.AFTERNOON), 1);
    });
    logger.debug(
      () =>
        `EmployeeWeeklyAfternoonsConstraint employeeId[${employeeId}] dates[${week.map(
          date => this.dateService.format(date)
        )}] ==> ${constraintToString(afternoon)}`
    );
  }
  protected employeeWeeklyAfternoonActivities(
    employeeId: number,
    week: Array<Date>
  ): string {
    return `${employeeId}_${format(week[0])}_afternoon_activities_per_week`;
  }
}

class CarsDailyConstraint {
  private dateService = ApplicationContext.getInstance().getDateService();
  private actionService = ApplicationContext.getInstance().getActionService();
  private _action: Action;

  constructor(action: Action) {
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
        constraint.addCoefficient(variable(employeeId, date, this._action), 1);
      });
    logger.debug(
      () =>
        `CarsDailyConstraint date[${this.dateService.format(
          date
        )}] action[${this.actionService.getActionName(
          this._action
        )}] ==> ${constraintToString(constraint)}`
    );
  }
  protected carsDailyActivities(date: Date, action: Action) {
    const actionName = this.actionService.getActionName(action);
    return `cars_${format(date)}_${actionName}`;
  }
}

abstract class AbstractGroupDailyConstraint {
  private dateService = ApplicationContext.getInstance().getDateService();
  private actionService = ApplicationContext.getInstance().getActionService();
  private weekConstraintService = ApplicationContext.getInstance().getWeekConstraintService();
  private _action: Action;

  constructor(action: Action) {
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
      MAX_INTEGER
    );
    employeeIds.forEach(employeeId => {
      constraint.addCoefficient(variable(employeeId, date, this._action), 1);
    });
    logger.debug(
      () =>
        `AbstractGroupDailyConstraint groupId[${groupId}][${
          group.name
        }] dates[${this.dateService.format(date)}] ${employeeIds.map(
          id => `employeeId[${id}]`
        )} ==> ${constraintToString(constraint)}`
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
  protected groupDailyActivities(
    type: string,
    groupId: number,
    date: Date,
    action: Action
  ): string {
    const actionName = this.actionService.getActionName(action);
    return `${type}_${groupId}_${format(date)}_${actionName}`;
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
export class OptimizeShiftsService {
  private dateService = ApplicationContext.getInstance().getDateService();
  private workShiftService = ApplicationContext.getInstance().getWorkShiftService();
  private actionService = ApplicationContext.getInstance().getActionService();

  @stats("OptimizeShiftsService")
  public optimize(context: WorkContext): void {
    const opt = this.createOptimizationContext(context);
    const serializer = new OptimizationContextSerializer();

    new BackendWebService()
      .url("/workshifts-rest/optimize")
      .post()
      .json()
      .call(serializer.serialize(opt))
      .then(response => {
        const solutions: SolutionVariable[] = response.data;
        this.validateSolutions(context, solutions);
        this.range(context.date).forEach(date => {
          context.sortedEmployees().forEach(employeeId => {
            this.updateContext(context, solutions, employeeId, date);
          });
        });
      });
  }
  @stats("OptimizeShiftsService")
  protected createOptimizationContext(
    context: WorkContext
  ): OptimizationContext {
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

    [Action.MORNING, Action.AFTERNOON].forEach(action =>
      range.forEach(date => {
        context.sortedEmployees().forEach(employeeId => {
          opt.addObjectiveCoefficient(variable(employeeId, date, action), 1);
        });
      })
    );

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
      opt.getObjectives().forEach(objective => {
        logger.debug(() => `O: ${objective.name} ${objective.coefficient}`);
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
  @stats("OptimizeShiftsService")
  protected updateContext(
    context: WorkContext,
    solutions: SolutionVariable[],
    employeeId: number,
    date: Date
  ) {
    const selected = this.actionService
      .getActions()
      .map(action => {
        const value = this.getSolution(solutions, employeeId, date, action);
        return [action, value];
      })
      .filter(e => e[1] == 1)
      .map(e => e[0]);
    const newAction = selected.length == 1 ? selected[0] : Action.IDLE;
    const currAction = this.actionService.getAction(
      context.getShift(employeeId, date)
    );
    if (newAction != currAction) {
      logger.debug(
        () =>
          `Optimization output, update shift employeeId ${employeeId}, date ${this.dateService.format(
            date
          )}, ${this.actionService.getActionName(
            currAction
          )} ==> ${this.actionService.getActionName(newAction)}`
      );
      context.setShift(
        employeeId,
        date,
        this.actionService.getLabels(newAction)[0]
      );
    }
  }
  @stats("OptimizeShiftsService")
  protected validateSolutions(
    context: WorkContext,
    solutions: SolutionVariable[]
  ) {
    this.range(context.date).forEach(date => {
      context.sortedEmployees().forEach(employeeId => {
        const values = new Map<Action, number>();
        this.actionService.getActions().forEach(action => {
          const value = this.getSolution(solutions, employeeId, date, action);
          if (value != 0 && value != 1) {
            throw Error(
              `employeeId ${employeeId} date ${this.dateService.format(
                date
              )} action ${this.actionService.getActionName(
                action
              )}, invalid value: ${value}, expected 0 or 1.`
            );
          }
          values.set(action, value);
        });
        const selected = Array.from(values.entries())
          .filter(e => e[1] == 1)
          .map(e => e[0]);
        if (selected.length > 1) {
          throw Error(
            `employeeId ${employeeId} date ${this.dateService.format(
              date
            )}, more than one selection.`
          );
        }
      });
    });
  }

  protected getSolution(
    solutions: SolutionVariable[],
    employeeId: number,
    date: Date,
    action: Action
  ) {
    const vars = solutions.filter(
      o => o.name == variable(employeeId, date, action)
    );
    if (vars.length == 1) {
      return vars[0].value;
    }
    logger.info(
      () =>
        `employeeId ${employeeId} date ${this.dateService.format(
          date
        )} action ${this.actionService.getActionName(
          action
        )} doesn't exist in the solution`
    );
    return 0;
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
