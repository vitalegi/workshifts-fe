import { factory } from "../utils/ConfigLog4j";
import { CacheManager, CacheConfig } from "./Cache";
import { StatsCollector } from "./Stats";

//ms
const loggerThreshold = 5;

export const timestamp = () =>
  window.performance &&
  window.performance.now &&
  window.performance.timing &&
  window.performance.timing.navigationStart
    ? window.performance.now() + window.performance.timing.navigationStart
    : Date.now();

export function stats(className?: string) {
  const logger = factory.getLogger("utils.Decorators.stats");

  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const fullName = className != undefined ? `${className}.${key}` : key;
    descriptor.value = function(...args: any[]) {
      logger.debug(() => `Call ${fullName} start`);
      const startTime = timestamp();
      try {
        const result = originalMethod.apply(this, args);
        const duration = timestamp() - startTime;
        logger.debug(() => `Call ${fullName} end [${duration}]`);
        StatsCollector.addEntry(fullName, duration);
        return result;
      } catch (error) {
        const duration = timestamp() - startTime;
        logger.error(() => `Call ${fullName} failed [${duration}]`);
        throw error;
      }
    };
    return descriptor;
  };
}

export function cacheable(
  name: string,
  key: (args: any) => string = (args: any) => args,
  config?: CacheConfig
) {
  const logger = factory.getLogger("utils.Decorators.cacheable");
  return function(
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const cache = CacheManager.getInstance().get(name);
      if (config) {
        cache.config = config;
      }
      const entryKey = key(args);
      const cachedValue = cache.get(entryKey);
      if (typeof cachedValue !== "undefined") {
        return cachedValue;
      }
      const result = originalMethod.apply(this, args);
      cache.put(entryKey, result);
      return result;
    };
    return descriptor;
  };
}
