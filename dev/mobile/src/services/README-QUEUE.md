# Unified Queue Service - Usage Guide

## Quick Start

### Add Item to Queue

```typescript
import { queueService } from './queue.service';

// Add any item to queue
await queueService.addToQueue({
  id: 'unique-id',
  type: 'incident', // or 'expense', 'leave_request', 'document_upload'
  data: yourItemData,
});
```

### Process Queue

```typescript
// Process all items in queue
await queueService.processQueue(async (item) => {
  // Your submission logic
  if (item.type === 'incident') {
    await incidentsService.submitIncident(item.data);
  }
});
```

### Manual Retry

```typescript
// Reset item for immediate retry
await queueService.resetForRetry(itemId);
```

### Remove Item

```typescript
await queueService.removeFromQueue(itemId);
```

## Exponential Backoff

Automatic retry delays:
- Retry 1: ~1 second
- Retry 2: ~2 seconds  
- Retry 3: ~4 seconds
- Retry 4: ~8 seconds
- Retry 5: ~16 seconds
- Max: 5 minutes

After 5 failed retries, item status becomes 'failed' and stops auto-retry.

## Error Handling

```typescript
// Mark item as failed with error details
await queueService.markAsFailed(
  itemId,
  'Error message',
  '409' // HTTP status code
);

// Get user-friendly error guidance
const guidance = queueService.getErrorGuidance('409', 'Conflict error');
// Returns: "Conflict detected. This item may have been modified by someone else."
```

## Queue Statistics

```typescript
const stats = await queueService.getQueueStats();
// { total: 5, pending: 2, failed: 1, submitting: 1, retrying: 1 }
```

## Migration Example

### Before (Old Local Queue)
```typescript
const QUEUE_KEY = '@my_queue';
await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
```

### After (Unified Queue)
```typescript
import { queueService } from './queue.service';
await queueService.addToQueue({ id, type: 'expense', data });
```
