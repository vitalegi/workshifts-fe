import { factory } from "@/utils/ConfigLog4j";
import { DayOfWeek } from "@/utils/DayOfWeek";

export class DateService {
  private logger = factory.getLogger("services.DateService");
  public isStartOfWeek(date: Date) {
    return this.getDayOfWeek(date) == DayOfWeek.MONDAY;
  }

  public isEndOfWeek(date: Date) {
    return this.getDayOfWeek(date) == DayOfWeek.SUNDAY;
  }

  public getStartOfMonth(date: Date) {
    return this.createDate(date.getFullYear(), date.getMonth(), 1);
  }

  public getEndOfMonth(date: Date) {
    return this.createDate(date.getFullYear(), date.getMonth() + 1, 0);
  }

  public getStartOfWeek(date: Date): Date {
    let startOfWeek = date;
    while (!this.isStartOfWeek(startOfWeek)) {
      startOfWeek = this.addDays(startOfWeek, -1);
    }
    return startOfWeek;
  }
  public getEndOfWeek(date: Date): Date {
    let endOfWeek = date;
    while (!this.isEndOfWeek(endOfWeek)) {
      endOfWeek = this.addDays(endOfWeek, +1);
    }
    return endOfWeek;
  }

  public getDayOfWeek(date: Date): DayOfWeek {
    switch (date.getDay()) {
      case 1:
        return DayOfWeek.MONDAY;
      case 2:
        return DayOfWeek.TUESDAY;
      case 3:
        return DayOfWeek.WEDNESDAY;
      case 4:
        return DayOfWeek.THURSDAY;
      case 5:
        return DayOfWeek.FRIDAY;
      case 6:
        return DayOfWeek.SATURDAY;
      case 0:
        return DayOfWeek.SUNDAY;
      default:
        throw new Error("Unrecognized date " + date);
    }
  }

  public getDayOfWeekLabel(dayOfWeek: DayOfWeek): string {
    switch (dayOfWeek) {
      case DayOfWeek.MONDAY:
        return "L";
      case DayOfWeek.TUESDAY:
        return "M";
      case DayOfWeek.WEDNESDAY:
        return "M";
      case DayOfWeek.THURSDAY:
        return "G";
      case DayOfWeek.FRIDAY:
        return "V";
      case DayOfWeek.SATURDAY:
        return "S";
      case DayOfWeek.SUNDAY:
        return "D";
    }
  }
  public getDayOfWeekName(dayOfWeek: DayOfWeek): string {
    switch (dayOfWeek) {
      case DayOfWeek.MONDAY:
        return "MONDAY";
      case DayOfWeek.TUESDAY:
        return "TUESDAY";
      case DayOfWeek.WEDNESDAY:
        return "WEDNESDAY";
      case DayOfWeek.THURSDAY:
        return "THURSDAY";
      case DayOfWeek.FRIDAY:
        return "FRIDAY";
      case DayOfWeek.SATURDAY:
        return "SATURDAY";
      case DayOfWeek.SUNDAY:
        return "SUNDAY";
    }
  }

  public getDayOfWeekFromName(dayOfWeekName: string): DayOfWeek {
    const days = this.getDaysOfWeek().filter(dayEnum => {
      const name = this.getDayOfWeekName(dayEnum);
      return name == dayOfWeekName;
    });
    if (days.length == 1) {
      return days[0];
    }
    throw new Error(`Cannot convert [${dayOfWeekName}] to a DayOfWeek obj`);
  }

  public getDaysOfWeek(): DayOfWeek[] {
    return [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY
    ];
  }

  /**
   * Parse a string in the format "yyyy-MM-dd" or "yyyy-MM"
   * @param text
   */
  public parse(text: string): Date {
    let year = 0;
    let month = 0;
    let day = 1;

    try {
      const values = text.split("-");
      year = parseInt(values[0]);
      month = parseInt(values[1]) - 1;
      if (values.length == 3) {
        day = parseInt(values[2]);
      }
    } catch (e) {
      throw Error("Text " + text + " is not a valid date." + e);
    }
    return this.createDate(year, month, day);
  }

  public format(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const padding = (n: number) => this.leftPadding("" + n, "0", 2);
    return `${year}-${padding(month)}-${padding(day)}`;
  }

  public formatShort(date: Date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const padding = (n: number) => this.leftPadding("" + n, "0", 2);
    return `${padding(day)}-${padding(month)}`;
  }

  public formatYYYYMM(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const padding = (n: number) => this.leftPadding("" + n, "0", 2);
    return `${year}-${padding(month)}`;
  }

  public isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  public range(from: Date, to: Date): Array<Date> {
    const range = Array<Date>();

    let currentDate = this.clone(from);
    while (!this.isAfter(currentDate, to)) {
      range.push(currentDate);
      currentDate = this.addDays(currentDate, 1);
    }
    return range;
  }

  public isBefore(date1: Date, date2: Date): boolean {
    return date1 < date2;
  }

  public isAfter(date1: Date, date2: Date): boolean {
    return date1 > date2;
  }

  public createDate(year: number, month: number, day: number): Date {
    const date = new Date(year, month, day);
    if (!this.isValidDate(date)) {
      throw Error(
        "Not a valid date. [" + year + "] [" + month + "] [" + day + "]"
      );
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  public getWeek(date: Date): Array<Date> {
    this.logger.debug(() => `Input: ${this.format(date)}`);
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = this.getEndOfWeek(date);
    this.logger.debug(
      () => `Output: ${this.format(startOfWeek)} - ${this.format(endOfWeek)}`
    );
    return this.range(startOfWeek, endOfWeek);
  }

  public getWeeks(dates: Array<Date>): Array<Array<Date>> {
    const weeksWithDuplicates = dates.map(date => this.getWeek(date));
    const weeks = new Array<Array<Date>>();
    const format = (dates: Array<Date>) => this.format(dates[0]);

    weeksWithDuplicates.forEach(week => {
      if (weeks.filter(w => format(w) == format(week)).length == 0) {
        weeks.push(week);
      }
    });
    return weeks;
  }

  private clone(date: Date): Date {
    return new Date(date.getTime());
  }

  public addDays(date: Date, days: number): Date {
    const clone = this.clone(date);
    clone.setDate(clone.getDate() + days);
    return clone;
  }
  public getWeekendDays(): DayOfWeek[] {
    return this.getDaysOfWeek().filter(dayOfWeek => this.isWeekend(dayOfWeek));
  }
  public getWeekdays(): DayOfWeek[] {
    return this.getDaysOfWeek().filter(dayOfWeek => !this.isWeekend(dayOfWeek));
  }
  public isWeekend(dayOfWeek: DayOfWeek): boolean {
    switch (dayOfWeek) {
      case DayOfWeek.MONDAY:
      case DayOfWeek.TUESDAY:
      case DayOfWeek.WEDNESDAY:
      case DayOfWeek.THURSDAY:
      case DayOfWeek.FRIDAY:
        return false;
      default:
        return true;
    }
  }

  protected leftPadding(
    str: string,
    paddingString: string,
    padding: number
  ): string {
    while (str.length < padding) {
      str = paddingString + str;
    }
    return str;
  }
}
