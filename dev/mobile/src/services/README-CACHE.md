# Cache Service

## Overview
The cache service provides offline support for list and detail screens using AsyncStorage. It implements the "show cached then sync" pattern for a better user experience.

## Usage

### Basic Caching
```typescript
import { cacheService } from './cache.service';

// Set cache
await cacheService.set('/approvals', data, params, { ttl: 300000 }); // 5 min TTL

// Get cache
const cached = await cacheService.get('/approvals', params);

// Remove cache
await cacheService.remove('/approvals', params);
```

### Show Cached Then Sync Pattern
```typescript
// Try cache first
const cached = await cacheService.get('/approvals', params);
if (cached) {
  // Show cached data immediately
  setData(cached);
  setIsFromCache(true);
  
  // Refresh in background
  apiService.fetch(params)
    .then(fresh => {
      setData(fresh);
      setIsFromCache(false);
      cacheService.set('/approvals', fresh, params);
    })
    .catch(err => console.error('Background refresh failed:', err));
  return;
}

// No cache - fetch from server
const fresh = await apiService.fetch(params);
setData(fresh);
await cacheService.set('/approvals', fresh, params);
```

## Cache Keys
Cache keys are generated from endpoint + params:
- `/approvals` + `{page: 1, status: 'PENDING'}` → `@cache_/approvals{"page":1,"status":"PENDING"}`

## TTL (Time To Live)
- Default: 5 minutes
- Can be customized per cache entry
- Expired cache is automatically removed on read

## Implemented In
- ✅ WorkScreen (approvals list)
- ✅ TasksListScreen (tasks list)
- 🔄 ApprovalDetailScreen (pending)
- 🔄 TaskDetailScreen (pending)

## Best Practices
1. Only cache page 1 of lists (not pagination)
2. Use shorter TTL for frequently changing data
3. Clear cache on logout
4. Show visual indicator when displaying cached data
5. Always refresh in background after showing cache
