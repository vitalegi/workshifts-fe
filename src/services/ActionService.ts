import { Action } from "../models/Action";

export class ActionService {
  public getAllLabels(): Array<string> {
    const labels: string[] = [];
    this.getLabels(Action.IDLE).forEach(value => labels.push(value));
    this.getLabels(Action.MORNING).forEach(value => labels.push(value));
    this.getLabels(Action.AFTERNOON).forEach(value => labels.push(value));
    this.getLabels(Action.AWAY).forEach(value => labels.push(value));
    return labels;
  }

  public getLabels(action: Action): Array<string> {
    if (action == Action.MORNING) {
      return ["M", "M*"];
    }
    if (action == Action.AFTERNOON) {
      return ["P", "P*"];
    }
    if (action == Action.AWAY) {
      return ["Fer", "L104", "Rec"];
    }
    if (action == Action.IDLE) {
      return [this.getDefaultLabel()];
    }
    return [];
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
