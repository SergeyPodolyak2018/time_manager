class CacheManager {
  private cache: Map<string, any>;
  private readonly maxCacheSize: number | undefined;

  constructor(maxCacheSize: number | undefined) {
    this.cache = new Map<string, any>();
    this.maxCacheSize = maxCacheSize;
  }

  public addToCache<T>(key: string, value: T) {
    if (this.maxCacheSize && this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.removeFromCache(oldestKey);
    }

    this.cache.set(key, value);
  }

  public getFromCache<T>(key: string) {
    return this.cache.get(key) as T;
  }

  public removeFromCache(key: string) {
    this.cache.delete(key);
  }
}

export default CacheManager;
