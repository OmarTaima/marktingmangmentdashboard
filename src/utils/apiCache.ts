/**
 * API Cache Manager
 * Provides in-memory caching for API requests to avoid redundant network calls
 * 
 * Features:
 * - Time-based expiration (TTL)
 * - Manual cache invalidation
 * - Cache key generation from URL and params
 * - Memory-efficient storage
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheConfig {
    ttl?: number; // Time to live in milliseconds (default: 5 minutes)
    maxSize?: number; // Maximum number of cached entries (default: 100)
}

class ApiCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
    private maxSize: number = 100;

    constructor(config?: CacheConfig) {
        if (config?.ttl) this.defaultTTL = config.ttl;
        if (config?.maxSize) this.maxSize = config.maxSize;
    }

    /**
     * Generate a unique cache key from endpoint and parameters
     */
    private generateKey(endpoint: string, params?: any): string {
        if (!params) return endpoint;
        
        // Sort params for consistent key generation
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {} as any);
        
        return `${endpoint}?${JSON.stringify(sortedParams)}`;
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry<any>): boolean {
        return Date.now() < entry.expiresAt;
    }

    /**
     * Enforce max cache size by removing oldest entries
     */
    private enforceMaxSize(): void {
        if (this.cache.size <= this.maxSize) return;

        // Convert to array and sort by timestamp
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

        // Remove oldest entries until within limit
        const toRemove = entries.slice(0, this.cache.size - this.maxSize);
        toRemove.forEach(([key]) => this.cache.delete(key));
    }

    /**
     * Get cached data if available and valid
     */
    get<T>(endpoint: string, params?: any): T | null {
        const key = this.generateKey(endpoint, params);
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (!this.isValid(entry)) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Store data in cache
     */
    set<T>(endpoint: string, data: T, params?: any, ttl?: number): void {
        const key = this.generateKey(endpoint, params);
        const now = Date.now();
        const expiresAt = now + (ttl || this.defaultTTL);

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt,
        });

        this.enforceMaxSize();
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(endpoint: string, params?: any): void {
        const key = this.generateKey(endpoint, params);
        this.cache.delete(key);
    }

    /**
     * Invalidate all cache entries matching a pattern
     * Useful for invalidating all entries for a specific resource
     */
    invalidatePattern(pattern: string): void {
        const keys = Array.from(this.cache.keys());
        keys.forEach((key) => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Wrapper function to automatically cache API calls
     */
    async cachedRequest<T>(
        endpoint: string,
        apiCall: () => Promise<T>,
        params?: any,
        options?: {
            ttl?: number;
            forceRefresh?: boolean;
        }
    ): Promise<T> {
        // Check if force refresh is requested
        if (options?.forceRefresh) {
            this.invalidate(endpoint, params);
        }

        // Try to get from cache first
        const cached = this.get<T>(endpoint, params);
        if (cached !== null) {
            console.log(`✅ Cache HIT: ${endpoint}`);
            return cached;
        }

        // Cache miss - fetch from API
        console.log(`⬇️ Cache MISS: ${endpoint}`);
        try {
            const data = await apiCall();
            this.set(endpoint, data, params, options?.ttl);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            throw error;
        }
    }
}

// Export singleton instance
export const apiCache = new ApiCache({
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 100, // Store up to 100 different requests
});

// Export helper function for easy use
export const withCache = <T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    params?: any,
    ttl?: number
): Promise<T> => {
    return apiCache.cachedRequest(endpoint, apiCall, params, { ttl });
};

// Export invalidation helpers
export const invalidateCache = (endpoint: string, params?: any) => {
    apiCache.invalidate(endpoint, params);
};

export const invalidateCachePattern = (pattern: string) => {
    apiCache.invalidatePattern(pattern);
};

export const clearAllCache = () => {
    apiCache.clear();
};

export default apiCache;
