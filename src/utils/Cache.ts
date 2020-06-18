import { factory } from "../utils/ConfigLog4j";

const timestamp = () =>
  window.performance &&
  window.performance.now &&
  window.performance.timing &&
  window.performance.timing.navigationStart
    ? window.performance.now() + window.performance.timing.navigationStart
    : Date.now();

export class CacheConfig {
  public maxSize = 1000;
  public ttl = 500;

  public static init(maxSize: number, ttl: number): CacheConfig {
    const config = new CacheConfig();
    config.maxSize = maxSize;
    config.ttl = ttl;
    return config;
  }

  public toString(): string {
    return `maxSize: ${this.maxSize} ttl: ${this.ttl}`;
  }
}

export class CacheConfigFactory {
  private _instance = new CacheConfig();

  public maxSize(maxSize: number): CacheConfigFactory {
    this._instance.maxSize = maxSize;
    return this;
  }
  public ttl(ttl: number): CacheConfigFactory {
    this._instance.ttl = ttl;
    return this;
  }
  public build(): CacheConfig {
    return this._instance;
  }
}

class CacheEntry<V> {
  public value: V;
  public inserted = timestamp();

  public constructor(value: V) {
    this.value = value;
  }
}

class CacheStats {
  public hits = 0;
  public miss = 0;
  public evict = 0;
  public size = 0;
}

export class Cache<K, V> {
  private logger = factory.getLogger("utils.Cache.Cache");
  private _entries: Map<any, CacheEntry<V>> = new Map();
  protected _stats = new CacheStats();
  public config = new CacheConfig();

  public get(key: K): V | undefined {
    this.validateEntry(key);
    const value = this._entries.get(key)?.value;
    if (typeof value !== "undefined") {
      this.logger.debug(() => `HIT! ${key}`);
      this._stats.hits++;
    } else {
      this.logger.debug(() => `MISS! ${key}`);
      this._stats.miss++;
    }
    return value;
  }
  public put(key: K, value: V) {
    if (this.size() >= this.config.maxSize) {
      this.cleanup();
    }
    this.logger.debug(() => `SIZE: ${this.size()}`);
    this._stats.size = this.size();
    this._entries.set(key, new CacheEntry(value));
  }

  public evict(key: K) {
    this.doEvict(key);
  }

  protected validateEntry(key: K): void {
    if (!this._entries.has(key)) {
      return;
    }
    const entry = this._entries.get(key) as CacheEntry<V>;
    if (timestamp() - entry.inserted > this.config.ttl) {
      this.logger.debug(() => `Key is too old: ${key}`);
      this.doEvict(key);
    }
  }

  protected doEvict(key: K) {
    this._stats.evict++;
    this._entries.delete(key);
  }

  protected size() {
    return this._entries.size;
  }

  protected cleanup() {
    const numberOfEntriesToBeDeleted = Math.max(
      0,
      this.size() - this.config.maxSize
    );
    this.logger.debug(() => `Delete ${numberOfEntriesToBeDeleted} entries`);
    const toBeDeleted = Array.from(this._entries.entries())
      .sort((a, b) => a[1].inserted - b[1].inserted)
      .slice(0, numberOfEntriesToBeDeleted);

    toBeDeleted
      .map(entry => {
        this.logger.debug(() => `Cleanup: ${entry[0]}`);
        return entry;
      })
      .forEach(entry => this.doEvict(entry[0]));
  }

  public stats(): string {
    return `HITS: ${this._stats.hits} MISS: ${this._stats.miss} EVICT: ${this._stats.evict} SIZE: ${this._stats.size}`;
  }

  public resetStats(): void {
    this._stats = new CacheStats();
  }
}

export class CacheManager {
  private static _instance: CacheManager;

  private logger = factory.getLogger("utils.Cache.CacheManager");
  private _caches: Map<string, Cache<string, any>> = new Map();

  public static getInstance(): CacheManager {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager();
    }
    return CacheManager._instance;
  }

  public get(cache: string): Cache<string, any> {
    if (!this._caches.has(cache)) {
      this._caches.set(cache, new Cache());
    }
    return this._caches.get(cache) as Cache<string, any>;
  }

  public get caches(): Map<string, Cache<string, any>> {
    return this._caches;
  }
}

setInterval(() => {
  const logger = factory.getLogger("utils.Cache.stats");

  Array.from(CacheManager.getInstance().caches.entries()).forEach(cache => {
    logger.info(
      () => `CACHE STATS [${cache[0]}] ${cache[1].stats()} ${cache[1].config}`
    );
    cache[1].resetStats();
  });
}, 10000);
