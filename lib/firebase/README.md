# Firebase Utilities

This folder contains all Firebase-related code for the application.

## Structure

- `config.ts` - Firebase initialization and configuration
- `firestore-utils.ts` - Reusable Firestore helper functions
- `types.ts` - TypeScript type definitions for Firestore data
- `index.ts` - Central export point

## Usage

### Direct Firebase Calls (Client-side)

```typescript
import { readCollection, addToCollectionBatch } from "@/lib/firebase";

// Read collection
const elements = await readCollection<MagicElementData>("magicElements");

// Add items
await addToCollectionBatch("magicElements", {
  fire: { name: "Fire", weaknessIds: ["water"] }
});
```

### API Routes (Server-side)

Use the API routes in `app/api/dnd/` for server-side operations with additional validation and security.

## Direct Calls vs API Routes

### Direct Firebase Calls (Current Approach)
**Pros:**
- ✅ Simpler code, fewer layers
- ✅ Real-time updates possible (with `onSnapshot`)
- ✅ Client-side caching (IndexedDB persistence)
- ✅ Lower latency (direct connection)
- ✅ Offline support built-in

**Cons:**
- ❌ Exposes Firebase config to client
- ❌ Security relies entirely on Firestore rules
- ❌ No server-side validation
- ❌ Can't add business logic easily
- ❌ Harder to rate limit or add middleware

### API Routes (Alternative Approach)
**Pros:**
- ✅ Hides Firebase config (can use server-only env vars)
- ✅ Server-side validation and business logic
- ✅ Better security (API keys stay on server)
- ✅ Can add rate limiting, authentication middleware
- ✅ Easier to add logging, analytics, etc.

**Cons:**
- ❌ More code and complexity
- ❌ No real-time updates (unless using SSE/WebSockets)
- ❌ Extra network hop (client → API → Firebase)
- ❌ No built-in offline support
- ❌ More server resources needed

## Recommendation

**For D&D app: Use Direct Calls** because:
1. Real-time updates are valuable (multiple users editing campaigns)
2. Offline support is important (DMs may work offline)
3. Simpler architecture for MVP
4. Firestore security rules are sufficient for most use cases

**Consider API Routes for:**
- Sensitive operations (payments, admin actions)
- Complex validation logic
- Operations requiring server-side secrets
- When you need rate limiting or custom middleware
