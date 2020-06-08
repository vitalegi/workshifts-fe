import { Action } from "../models/Action";

export class ActionService {
  public getAllLabels(): Array<string> {
    const labels: string[] = [];
    this.getLabels(Action.IDLE).forEach((value) => labels.push(value));
    this.getLabels(Action.MORNING).forEach((value) => labels.push(value));
    this.getLabels(Action.AFTERNOON).forEach((value) => labels.push(value));
    this.getLabels(Action.AWAY).forEach((value) => labels.push(value));
    return labels;
  }

  public getLabels(action: Action): Array<string> {
    if (action == Action.MORNING) {
      return ["M", "M*"];
    }
    if (action == Action.AFTERNOON) {
      return ["P", "P*", "PJ"];
    }
    if (action == Action.AWAY) {
      return ["F", "Rec", "Agg", "mal", "/", "L104"];
    }
    if (action == Action.IDLE) {
      return [this.getIdleLabel()];
    }
    return [];
  }

  public getActions(): Array<Action> {
    return [Action.MORNING, Action.AFTERNOON, Action.AWAY, Action.IDLE];
  }

  public getActionName(action: Action): string {
    switch (action) {
      case Action.MORNING:
        return "MORNING";
      case Action.AFTERNOON:
        return "AFTERNOON";
      case Action.AWAY:
        return "AWAY";
      case Action.IDLE:
        return "IDLE";
    }
  }

  public getActionFromName(actionName: string): Action {
    const actions = this.getActions().filter((actionEnum) => {
      const name = this.getActionName(actionEnum);
      return name == actionName;
    });
    if (actions.length == 1) {
      return actions[0];
    }
    throw new Error(`Cannot convert [${actionName}] to an Action obj`);
  }

  public getIdleLabel(): string {
    return this.getDefaultLabel();
  }

  public getDefaultLabel(): string {
    return "---";
  }

  public getAction(label: string): Action {
    if (this.getLabels(Action.IDLE).indexOf(label) != -1) {
      return Action.IDLE;
    }
    if (this.getLabels(Action.MORNING).indexOf(label) != -1) {
      return Action.MORNING;
    }
    if (this.getLabels(Action.AFTERNOON).indexOf(label) != -1) {
      return Action.AFTERNOON;
    }
    if (this.getLabels(Action.AWAY).indexOf(label) != -1) {
      return Action.AWAY;
    }
    throw new Error("Label [" + label + "] not recognized as an action");
  }
}
