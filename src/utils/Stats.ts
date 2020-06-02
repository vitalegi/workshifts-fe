import { factory } from "@/utils/ConfigLog4j";

const durationsSize = 200;
const longCallThreshold = 5;

class StatsEntry {
  protected _counter = 0;
  protected _longCallsCounter = 0;
  protected _durations: number[] = [];


  public addDuration(duration: number) {
    if (this._durations.length >= durationsSize) {
      this._durations.shift();
    }
    this._durations.push(duration);
    if (duration > longCallThreshold) {
        this._longCallsCounter++;
    }
  }

  public increaseCounter(): number {
    return ++this._counter;
  }

  public get counter(): number {
    return this._counter;
  }

  public durations(): number[] {
    return this._durations;
  }
  public avg(): number {
    const total = this._durations.reduce((acc, c) => acc + c, 0);
    return total / this._durations.length;
  }
  public weight(): number {
    return this.counter * this.avg();
  }
  public get longCalls(): number {
      return this._longCallsCounter;
  }
}

export class StatsCollector {
  private static _instance: StatsCollector;

  private logger = factory.getLogger("utils.Stats.StatsCollector");
  private _entries: Map<string, StatsEntry> = new Map();

  public static getInstance(): StatsCollector {
    if (!StatsCollector._instance) {
      StatsCollector._instance = new StatsCollector();
    }
    return StatsCollector._instance;
  }

  public static addEntry(key: string, duration: number) {
    StatsCollector.getInstance().addEntry(key, duration);
  }

  public addEntry(key: string, duration: number) {
    if (!this._entries.has(key)) {
      this._entries.set(key, new StatsEntry());
    }
    const entry = this._entries.get(key) as StatsEntry;
    entry.increaseCounter();
    entry.addDuration(duration);
  }

  public resetEntry(key: string) {
    this._entries.delete(key);
  }

  public get entries(): Map<string, StatsEntry> {
    return this._entries;
  }
}

setInterval(() => {
  if (StatsCollector.getInstance().entries.size == 0) {
    return;
  }
  const logger = factory.getLogger("utils.Stats.stats");

  logger.info(() => `Count\t|\tLong\t|\tAvg\t|\tWeight\t|\tName`);
  Array.from(StatsCollector.getInstance().entries.entries())
    .sort((a, b) => a[1].weight() - b[1].weight())
    .reverse()
    .forEach((entry) => {
      logger.info(
        () =>
          `${entry[1].counter}\t|\t${entry[1].longCalls}\t|\t${entry[1]
            .avg()
            .toPrecision(4)}\t|\t${entry[1].weight().toPrecision(4)}\t|\t${
            entry[0]
          }`
      );
      StatsCollector.getInstance().resetEntry(entry[0]);
    });
}, 20000);
