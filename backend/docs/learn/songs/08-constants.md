# Constants Documentation

## Overview
Constants centralize magic strings and numbers used throughout the Songs module. They provide type safety, easy modification, and prevent typos.

## File Location
`backend/src/songs/constants/song.constants.ts`

---

## SONG_SOURCE_TYPE

```typescript
export const SONG_SOURCE_TYPE = {
  YOUTUBE: 'youtube',
} as const;
```

### Purpose
Define supported song source types.

### Properties

#### YOUTUBE
```typescript
YOUTUBE: 'youtube'
```

**Value**: `'youtube'`

**Purpose**: Identifier for YouTube as the source

**Usage**:
```typescript
const song = await repository.create({
  data: {
    sourceType: SONG_SOURCE_TYPE.YOUTUBE,
    sourceId: youtubeId,
  }
});
```

**Future Extensions**:
```typescript
export const SONG_SOURCE_TYPE = {
  YOUTUBE: 'youtube',
  SOUNDCLOUD: 'soundcloud',
  SPOTIFY: 'spotify',
  APPLE_MUSIC: 'apple-music',
} as const;
```

---

## CONVERSION_JOB

```typescript
export const CONVERSION_JOB = {
  NAME: 'convert',
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
} as const;
```

### Purpose
Define configuration for the BullMQ conversion job.

### Properties

#### NAME
```typescript
NAME: 'convert'
```

**Value**: `'convert'`

**Purpose**: Job name identifier for BullMQ queue

**Usage**:
```typescript
await this.conversionQueue.add(
  CONVERSION_JOB.NAME,
  { url, songId, userId },
  { jobId: `convert-${youtubeId}` }
);
```

**Why string identifier?**
- BullMQ uses string names for queues and jobs
- Easy to reference across the codebase
- Consistent naming convention

---

#### MAX_ATTEMPTS
```typescript
MAX_ATTEMPTS: 3
```

**Value**: `3`

**Purpose**: Maximum number of retry attempts for failed jobs

**Usage**:
```typescript
await this.conversionQueue.add(
  CONVERSION_JOB.NAME,
  jobData,
  {
    attempts: CONVERSION_JOB.MAX_ATTEMPTS,
    backoff: { type: 'exponential', delay: CONVERSION_JOB.BACKOFF_DELAY_MS }
  }
);
```

**Why 3 attempts?**
- **Transient failures**: Network issues often resolve on retry
- **Balance**: Not too many (wastes resources), not too few (unreliable)
- **Exponential backoff**: Delays increase between attempts (5s, 10s, 20s)

**Retry Timeline**:
```
Attempt 1: Immediate
Attempt 2: 5 seconds later
Attempt 3: 10 seconds later
Failed after 3 attempts
```

---

#### BACKOFF_DELAY_MS
```typescript
BACKOFF_DELAY_MS: 5000
```

**Value**: `5000` (5 seconds)

**Purpose**: Initial delay between retry attempts

**Usage**:
```typescript
await this.conversionQueue.add(
  CONVERSION_JOB.NAME,
  jobData,
  {
    attempts: CONVERSION_JOB.MAX_ATTEMPTS,
    backoff: { 
      type: 'exponential',
      delay: CONVERSION_JOB.BACKOFF_DELAY_MS 
    }
  }
);
```

**Why 5 seconds?**
- **Network recovery**: Gives time for network issues to resolve
- **Service stability**: Doesn't overwhelm the system
- **User experience**: Not too long, not too short

**Exponential Backoff Calculation**:
```
Attempt 1: 0ms (immediate)
Attempt 2: 5000ms (5 seconds)
Attempt 3: 10000ms (10 seconds)
Attempt 4: 20000ms (20 seconds) - if MAX_ATTEMPTS was higher
```

---

## as const

All constants use TypeScript's `as const` assertion:

```typescript
export const CONVERSION_JOB = {
  NAME: 'convert',
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
} as const;
```

### Purpose
- **Type inference**: TypeScript infers literal types instead of generic types
- **Immutability**: Prevents modification at runtime
- **Type safety**: Ensures values are exactly as defined

### Without as const
```typescript
export const CONVERSION_JOB = {
  NAME: 'convert',  // Type: string
  MAX_ATTEMPTS: 3,  // Type: number
  BACKOFF_DELAY_MS: 5000,  // Type: number
};

// Can accidentally modify
CONVERSION_JOB.NAME = 'invalid'; // No compile error
CONVERSION_JOB.MAX_ATTEMPTS = 'invalid'; // No compile error
```

### With as const
```typescript
export const CONVERSION_JOB = {
  NAME: 'convert',  // Type: 'convert'
  MAX_ATTEMPTS: 3,  // Type: 3
  BACKOFF_DELAY_MS: 5000,  // Type: 5000
} as const;

// Cannot modify
CONVERSION_JOB.NAME = 'invalid'; // Compile error!
CONVERSION_JOB.MAX_ATTEMPTS = 5; // Compile error!
```

---

## Usage Examples

### Creating a Song
```typescript
import { SONG_SOURCE_TYPE } from './constants/song.constants';

const song = await repository.create({
  data: {
    title: 'Test Song',
    sourceType: SONG_SOURCE_TYPE.YOUTUBE,
    sourceId: 'abc123',
  }
});
```

### Enqueueing a Job
```typescript
import { CONVERSION_JOB } from './constants/song.constants';

await this.conversionQueue.add(
  CONVERSION_JOB.NAME,
  { url, songId, userId },
  {
    attempts: CONVERSION_JOB.MAX_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: CONVERSION_JOB.BACKOFF_DELAY_MS
    }
  }
);
```

### Checking Source Type
```typescript
import { SONG_SOURCE_TYPE } from './constants/song.constants';

if (song.sourceType === SONG_SOURCE_TYPE.YOUTUBE) {
  // Handle YouTube-specific logic
}
```

---

## Benefits of Constants

### 1. Avoid Magic Strings/Numbers
```typescript
// Bad (magic string)
if (song.sourceType === 'youtube') { }

// Good (constant)
if (song.sourceType === SONG_SOURCE_TYPE.YOUTUBE) { }
```

### 2. Easy to Modify
```typescript
// Change in one place
export const CONVERSION_JOB = {
  MAX_ATTEMPTS: 5, // Changed from 3
} as const;

// Affects all usages automatically
```

### 3. Type Safety
```typescript
// TypeScript knows exact values
const sourceType: 'youtube' = SONG_SOURCE_TYPE.YOUTUBE; // OK
const sourceType: 'spotify' = SONG_SOURCE_TYPE.YOUTUBE; // Compile error!
```

### 4. Documentation
Constants serve as documentation:
```typescript
CONVERSION_JOB.MAX_ATTEMPTS = 3 // Clearly documented
```

### 5. Refactoring
Easy to find all usages:
```bash
# Find all usages of MAX_ATTEMPTS
grep -r "CONVERSION_JOB.MAX_ATTEMPTS" src/
```

---

## Future Extensions

### Additional Source Types
```typescript
export const SONG_SOURCE_TYPE = {
  YOUTUBE: 'youtube',
  SOUNDCLOUD: 'soundcloud',
  SPOTIFY: 'spotify',
  APPLE_MUSIC: 'apple-music',
  DEEZER: 'deezer',
} as const;
```

### Job Configuration
```typescript
export const CONVERSION_JOB = {
  NAME: 'convert',
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
  TIMEOUT_MS: 300000, // 5 minutes timeout
  PRIORITY: 'normal',
} as const;
```

### Song Status
```typescript
export const SONG_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
```

---

## Related Documentation

- [Commands Documentation](./03-commands.md) - Constants usage in commands
- [Jobs Module](../jobs/00-overview.md) - Job processing configuration
- [Architecture Decisions](../architecture-decisions.md) - Design rationale

---

**Previous**: [DTOs Documentation](./07-dto.md)  
**Next**: [Overview](./00-overview.md)
