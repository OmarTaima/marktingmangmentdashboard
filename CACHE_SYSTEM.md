# API Caching System

## Overview

A comprehensive in-memory caching system has been implemented across all API services to improve performance and reduce redundant network requests.

## Features

- ✅ **Automatic Caching**: GET requests are automatically cached with a 5-minute TTL (Time To Live)
- ✅ **Smart Invalidation**: Cache is automatically cleared when data is modified (CREATE, UPDATE, DELETE)
- ✅ **Pattern-Based Clearing**: Related caches are invalidated together (e.g., updating a client also clears related branches, segments)
- ✅ **Memory Efficient**: Limits cache size to 100 entries maximum
- ✅ **Console Logging**: Cache hits and misses are logged for debugging

## How It Works

### Automatic Caching (GET Requests)

All GET requests are now automatically cached:

```typescript
// Example: Fetching services
const services = await getServices({ page: 1, limit: 10 });
// First call: ⬇️ Cache MISS: /services - Fetches from API
// Second call: ✅ Cache HIT: /services - Returns from cache

// Example: Fetching a specific client
const client = await getClientById("client123");
// First call: ⬇️ Cache MISS: /clients/client123
// Second call: ✅ Cache HIT: /clients/client123
```

### Automatic Cache Invalidation (Mutations)

When you create, update, or delete data, the cache is automatically cleared:

```typescript
// Create a new service
await createService({ en: "SEO", ar: "تحسين محركات البحث", price: 1000 });
// ✨ Automatically invalidates all /services cache entries

// Update a quotation
await updateQuotation("quotation123", { status: "approved" });
// ✨ Automatically invalidates all /quotations cache entries

// Delete a contract
await deleteContract("contract456");
// ✨ Automatically invalidates all /contracts cache entries
```

### Related Data Invalidation

Some operations invalidate multiple related caches:

```typescript
// Creating a branch for a client
await createBranch("client123", branchData);
// ✨ Invalidates:
//    - /clients/client123/branches
//    - /clients/client123

// Updating a segment
await updateSegment("client123", "segment456", segmentData);
// ✨ Invalidates:
//    - /clients/client123/segments
//    - /clients/client123
```

## Cache Duration

- **Default TTL**: 5 minutes (300,000 milliseconds)
- **Max Cache Size**: 100 entries
- Cache entries are automatically removed when:
  - They expire (after 5 minutes)
  - They are manually invalidated
  - Cache reaches maximum size (oldest entries removed first)

## Services with Caching

All API services now include caching:

### ✅ Client Service
- `getClients()` - Cached
- `getClientsWithFilters()` - Cached with params
- `getClientById(id)` - Cached per client
- Cache cleared on: create, update, patch, delete

### ✅ Services Service
- `getServices()` - Cached
- `getServiceById(id)` - Cached per service
- Cache cleared on: create, update, delete

### ✅ Quotations Service
- `getQuotations()` - Cached
- `getQuotationById(id)` - Cached per quotation
- Cache cleared on: create, update, delete

### ✅ Contracts Service
- `getContracts()` - Cached
- `getContractById(id)` - Cached per contract
- Cache cleared on: create, update, delete, sign, activate, complete, cancel, renew

### ✅ Packages Service
- `getPackages()` - Cached
- `getPackageById(id)` - Cached per package
- Cache cleared on: create, update, delete

### ✅ Items Service
- `getItems()` - Cached
- `getItemById(id)` - Cached per item
- Cache cleared on: create, update, delete

### ✅ Branches Service
- `getBranchesByClientId(clientId)` - Cached per client
- Cache cleared on: create, update, delete
- Also clears client cache

### ✅ Segments Service
- `getSegmentsByClientId(clientId)` - Cached per client
- Cache cleared on: create, update, delete
- Also clears client cache

### ✅ Competitors Service
- `getCompetitorsByClientId(clientId)` - Cached per client
- Cache cleared on: create, update, delete
- Also clears client cache

## Manual Cache Management

If you need to manually control the cache:

```typescript
import { invalidateCache, invalidateCachePattern, clearAllCache } from "@/api";

// Clear a specific cache entry
invalidateCache("/services", { page: 1, limit: 10 });

// Clear all entries matching a pattern
invalidateCachePattern("/clients"); // Clears all /clients/* entries

// Clear entire cache
clearAllCache();
```

## Cache Utilities

### `clearClientsCache()`
Clears all client-related cache entries.

### `clearServicesCache()`
Clears all services cache entries.

### `clearPackagesCache()`
Clears all packages cache entries.

### `clearItemsCache()`
Clears all items cache entries.

## Performance Benefits

- **Reduced Network Requests**: Repeated requests return instantly from cache
- **Lower Server Load**: Fewer API calls = less backend processing
- **Faster UI**: No loading states for cached data
- **Better UX**: Instant navigation between pages with cached data

## Console Output

You'll see helpful logs in the browser console:

```
✅ Cache HIT: /services
⬇️ Cache MISS: /quotations
```

## Technical Details

### Cache Key Generation

Cache keys are generated from:
1. **Endpoint URL**: `/services`, `/clients/123`, etc.
2. **Query Parameters**: Sorted and stringified for consistency

Example:
```
/services + { page: 1, limit: 10 } = "/services?{"limit":10,"page":1}"
```

### Cache Storage

- Stored in memory (browser RAM)
- Lost on page refresh
- Not persisted to localStorage or sessionStorage

### Thread Safety

The cache is synchronous and safe for concurrent reads in a single-threaded JavaScript environment.

## Troubleshooting

### Cache not updating after mutation?

Check that the mutation function includes cache invalidation:
```typescript
await api.post("/endpoint", data);
invalidateCachePattern("/endpoint"); // This line clears the cache
```

### Want to force refresh?

Use manual cache clearing:
```typescript
clearAllCache(); // Clear everything
await getClients(); // Fetch fresh data
```

### Need different TTL?

Modify `src/utils/apiCache.ts`:
```typescript
export const apiCache = new ApiCache({
    ttl: 10 * 60 * 1000, // 10 minutes instead of 5
    maxSize: 100,
});
```

## Future Enhancements

Potential improvements:
- [ ] Persistent cache using IndexedDB
- [ ] Configurable TTL per endpoint
- [ ] Cache warming on app load
- [ ] Cache statistics dashboard
- [ ] Background cache refresh
- [ ] Optimistic updates with cache

---

**Implementation Date**: November 17, 2025  
**Cache System Version**: 1.0  
**Location**: `src/utils/apiCache.ts`
