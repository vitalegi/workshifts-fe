export interface Notification {
  title: string;
  message: string;
}

export class ErrorNotification implements Notification {
  public title = "";
  public message = "";
  public wsError: any;

  constructor(title: string, message: string, wsError?: any) {
    this.title = title;
    this.message = message;
    this.wsError = wsError;
  }
}

export class GlobalNotification<E extends Notification> {
  private notifications = new Array<E>();

  public add(notification: E) {
    this.notifications.push(notification);
  }
  public count(): number {
    return this.notifications.length;
  }
  public has(): boolean {
    return this.notifications.length > 0;
  }
  public pop(): E {
    if (!this.has()) {
      throw new Error(`Empty list`);
    }
    return this.notifications.splice(0, 1)[0];
  }
  public get(): E {
    if (!this.has()) {
      throw new Error(`Empty list`);
    }
    return this.notifications[0];
  }
}
