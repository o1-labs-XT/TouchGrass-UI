# API Improvements for Likes Feature

**Date:** 2025-10-28
**Status:** Recommendations - Not Implemented
**Context:** Current likes implementation (PR #26) uses multiple API calls per submission

---

## Table of Contents
1. [Current API Endpoints](#current-api-endpoints)
2. [Performance Problems](#performance-problems)
3. [Ideal API Endpoints](#ideal-api-endpoints)
4. [Authentication & Security Improvements](#authentication--security-improvements)
5. [Implementation Priority](#implementation-priority)
6. [Future Considerations](#future-considerations)

---

## Current API Endpoints

### What We Have Now

#### 1. Like a Submission
```
POST /submissions/{submissionId}/likes
Content-Type: application/json

Request Body:
{
  "walletAddress": "B62qk..."
}

Response: 200 OK
{
  "id": "like-uuid",
  "submissionId": "submission-uuid",
  "walletAddress": "B62qk...",
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}

Errors:
- 400: Bad Request (invalid wallet address)
- 403: Forbidden (user needs approved submission to like)
- 404: Not Found (submission doesn't exist)
- 409: Conflict (user already liked this submission)
```

#### 2. Unlike a Submission
```
DELETE /submissions/{submissionId}/likes/{walletAddress}

Response: 204 No Content

Errors:
- 404: Not Found (like doesn't exist or submission doesn't exist)
```

#### 3. Get Like Count
```
GET /submissions/{submissionId}/likes/count

Response: 200 OK
{
  "submissionId": "submission-uuid",
  "count": 42
}

Errors:
- 404: Not Found (submission doesn't exist)
```

#### 4. Get All Likes for Submission
```
GET /submissions/{submissionId}/likes

Response: 200 OK
[
  {
    "id": "like-uuid",
    "submissionId": "submission-uuid",
    "walletAddress": "B62qk...",
    "createdAt": "2025-10-28T...",
    "updatedAt": "2025-10-28T..."
  },
  ...
]

Errors:
- 404: Not Found (submission doesn't exist)
```

**Note:** Currently we call `GET /likes` and filter client-side to check if user liked. This returns ALL likes, which is inefficient.

---

## Performance Problems

### Problem 1: N+1 Query Problem

**Current Behavior:**
- Chain view with 20 submissions
- Each LikeButton component makes 2 API calls on mount:
  1. `GET /submissions/{id}/likes/count`
  2. `GET /submissions/{id}/likes` (to check if user liked)
- **Total: 40 API calls** for a single page load

**Impact:**
- Slow page load on mobile networks (3G: 40 × 200ms = 8 seconds)
- Backend load scales linearly with number of submissions displayed
- Database query for every single submission
- Not scalable beyond 50-100 submissions per page

### Problem 2: Redundant Data Transfer

**Current Behavior:**
- `GET /submissions/{id}/likes` returns ALL likes for a submission
- Client-side filtering: `likes.some((like) => like.walletAddress === walletAddress)`
- If submission has 1000 likes, client downloads 1000 like objects just to check one boolean

**Impact:**
- Wasted bandwidth (KB-MB per page on popular submissions)
- Slow response times (database must fetch + serialize all likes)
- Privacy concern (exposes all user wallet addresses publicly)

### Problem 3: No Batch Operations

**Current Behavior:**
- No way to get like data for multiple submissions in one request
- Frontend must loop and await individual API calls
- Can't use Promise.all() effectively (still hits backend N times)

**Impact:**
- Serial API calls slower than parallel (even with Promise.all())
- Backend can't optimize queries (can't JOIN or batch database queries)
- Can't implement efficient caching strategies

### Problem 4: Like Data Not Included in Submissions

**Current Behavior:**
- `GET /submissions/{id}` returns submission data WITHOUT like count or user-liked status
- `GET /chains/{id}/submissions` returns array of submissions WITHOUT like data
- Frontend must make separate API calls for like data

**Impact:**
- Frontend always makes N additional requests
- Can't show like counts in submission lists efficiently
- Server-side rendering (SSR) not possible for like data

---

## Ideal API Endpoints

### Priority 1: Add Like Data to Submission Responses

#### Enhanced Submission Interface

```typescript
export interface Submission {
  // ... existing fields
  id: string;
  sha256Hash: string;
  walletAddress: string;
  challengeId: string;
  chainId: string;
  // ... etc.

  // NEW FIELDS
  likeCount: number;                    // Total likes for this submission
  isLikedByCurrentUser?: boolean;       // Whether current user has liked (requires auth)
}
```

#### Modified Endpoints

**1. Get Submission (with like data)**
```
GET /submissions/{submissionId}
Optional Header: X-Wallet-Address: B62qk...

Response: 200 OK
{
  "id": "submission-uuid",
  "sha256Hash": "abc123...",
  // ... other submission fields ...
  "likeCount": 42,
  "isLikedByCurrentUser": true    // Only if X-Wallet-Address header provided
}
```

**Benefits:**
- Zero additional API calls for like data
- Backend can JOIN submissions and likes tables in single query
- Enables server-side rendering (SSR)
- Simpler client-side code

**2. Get Chain Submissions (with like data)**
```
GET /chains/{chainId}/submissions
Optional Header: X-Wallet-Address: B62qk...

Response: 200 OK
[
  {
    "id": "submission-uuid-1",
    // ... submission fields ...
    "likeCount": 42,
    "isLikedByCurrentUser": true
  },
  {
    "id": "submission-uuid-2",
    "likeCount": 7,
    "isLikedByCurrentUser": false
  }
]
```

**Benefits:**
- 1 API call instead of 40+ for chain view
- ~95% reduction in API calls
- Backend can optimize with single database query + JOIN

### Priority 2: Batch Like Data Endpoint

**For scenarios where submission data already loaded, but need like data**

```
POST /submissions/likes/batch
Content-Type: application/json
Optional Header: X-Wallet-Address: B62qk...

Request Body:
{
  "submissionIds": [
    "submission-uuid-1",
    "submission-uuid-2",
    "submission-uuid-3"
  ]
}

Response: 200 OK
{
  "likes": {
    "submission-uuid-1": {
      "count": 42,
      "isLikedByCurrentUser": true
    },
    "submission-uuid-2": {
      "count": 7,
      "isLikedByCurrentUser": false
    },
    "submission-uuid-3": {
      "count": 0,
      "isLikedByCurrentUser": false
    }
  }
}

Errors:
- 400: Bad Request (invalid submission IDs or array too large)
- 413: Payload Too Large (max 100 submission IDs)
```

**Benefits:**
- 1 API call instead of N×2 calls
- Backend can optimize with single query: `WHERE submissionId IN (...)`
- Useful for infinite scroll, lazy loading, search results
- Client can batch requests intelligently

### Priority 3: Check If Current User Liked

**More efficient than fetching all likes**

```
GET /submissions/{submissionId}/likes/check?walletAddress={address}

Response: 200 OK
{
  "submissionId": "submission-uuid",
  "walletAddress": "B62qk...",
  "isLiked": true,
  "likedAt": "2025-10-28T..." // Only if isLiked: true
}

Errors:
- 400: Bad Request (invalid wallet address)
- 404: Not Found (submission doesn't exist)
```

**Benefits:**
- Returns boolean, not array of all likes
- Minimal data transfer (1 boolean vs N objects)
- Faster database query (indexed lookup vs full scan)
- Privacy-preserving (doesn't expose other users' likes)

**Note:** This is less important if Priority 1 (like data in submissions) is implemented.

### Priority 4: Get Submissions Liked by User

**Enable "My Likes" view**

```
GET /users/{walletAddress}/likes
Query Params:
  - limit: number (default: 20, max: 100)
  - offset: number (default: 0)
  - sortBy: "likedAt" | "submissionCreatedAt" (default: "likedAt")
  - sortOrder: "asc" | "desc" (default: "desc")

Response: 200 OK
{
  "likes": [
    {
      "id": "like-uuid",
      "submissionId": "submission-uuid",
      "walletAddress": "B62qk...",
      "likedAt": "2025-10-28T...",
      "submission": {
        // Full submission object (embedded)
        "id": "submission-uuid",
        "sha256Hash": "abc123...",
        // ... etc.
      }
    },
    ...
  ],
  "pagination": {
    "total": 142,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Benefits:**
- Enables "My Likes" profile view
- Shows user's like history
- Can paginate through thousands of likes
- Backend can optimize with JOIN

### Priority 5: Get Top Liked Submissions

**Enable leaderboard / trending view**

```
GET /submissions/top-liked
Query Params:
  - challengeId: string (optional - filter by challenge)
  - chainId: string (optional - filter by chain)
  - timeRange: "day" | "week" | "month" | "all" (default: "week")
  - limit: number (default: 20, max: 100)
  - offset: number (default: 0)

Response: 200 OK
{
  "submissions": [
    {
      // Full submission object
      "id": "submission-uuid",
      // ... submission fields ...
      "likeCount": 1543,
      "isLikedByCurrentUser": false,
      "rank": 1 // Position in leaderboard
    },
    ...
  ],
  "pagination": {
    "total": 500,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Benefits:**
- Enables gamification (leaderboards)
- Shows trending submissions
- Encourages engagement
- Backend can cache results (expensive query)

---

## Authentication & Security Improvements

### Current Security Model

**How it works now:**
```
POST /submissions/{id}/likes
{
  "walletAddress": "B62qk..."
}
```

**Problems:**
1. **No authentication** - Anyone can like as anyone else
2. **No signature verification** - walletAddress is just a string
3. **Vulnerable to abuse** - Bots can spam likes with random wallet addresses
4. **No rate limiting** - One IP can create millions of likes
5. **No session management** - Must send wallet address with every request

**Current validation (if any):**
- Backend checks if user has approved submission (403 error)
- Backend checks for duplicate likes (409 error)
- But NO verification that request came from wallet owner

### Improvement Option 1: Signed Like Actions (Simple)

**Sign each like/unlike action with wallet private key**

#### Protocol

**1. Frontend generates signature:**
```typescript
// User clicks like button
const message = {
  action: 'like',
  submissionId: 'submission-uuid',
  timestamp: Date.now(),
  nonce: crypto.randomUUID()
};

const messageString = JSON.stringify(message);
const signature = await signMessage(walletPrivateKey, messageString);

// Send to backend
await fetch('/submissions/{id}/likes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletAddress: walletPublicKey,
    message: messageString,
    signature: signature
  })
});
```

**2. Backend verifies signature:**
```typescript
// Backend endpoint
app.post('/submissions/:id/likes', (req, res) => {
  const { walletAddress, message, signature } = req.body;

  // 1. Verify signature matches wallet address
  const isValid = verifySignature(walletAddress, message, signature);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Parse message
  const parsed = JSON.parse(message);

  // 3. Verify timestamp (prevent replay attacks)
  const now = Date.now();
  if (Math.abs(now - parsed.timestamp) > 60000) { // 1 minute window
    return res.status(401).json({ error: 'Signature expired' });
  }

  // 4. Verify nonce not already used (prevent replay attacks)
  if (await isNonceUsed(parsed.nonce)) {
    return res.status(401).json({ error: 'Signature already used' });
  }

  // 5. Mark nonce as used
  await markNonceUsed(parsed.nonce);

  // 6. Verify submission ID matches
  if (parsed.submissionId !== req.params.id) {
    return res.status(400).json({ error: 'Submission ID mismatch' });
  }

  // 7. Create like
  const like = await createLike(walletAddress, parsed.submissionId);
  res.json(like);
});
```

**Pros:**
- Cryptographically proves user owns wallet
- Prevents impersonation
- Prevents replay attacks (timestamp + nonce)
- No session state needed (stateless)
- Compatible with Web3 principles (self-custody)

**Cons:**
- User must sign EVERY like/unlike action (UX friction)
- Requires wallet unlock for each action
- Backend must verify signature on every request (CPU cost)
- Must store used nonces (memory/database cost)
- Complex error handling if signature fails

**Implementation Effort:**
- Frontend: +50 lines (sign message, handle errors)
- Backend: +100 lines (verify signature, nonce tracking)
- Database: New table for nonces (+ cleanup job for expired nonces)
- Testing: Signature verification, replay attack prevention, timing issues

### Improvement Option 2: Session Key (Optimal UX)

**One-time signature creates a temporary session key for multiple actions**

#### Protocol

**1. One-time wallet signature (on app load):**
```typescript
// When user first visits app (or session expired)
const sessionKeyPair = await generateEphemeralKeyPair(); // Client-side key generation

const authMessage = {
  action: 'create_session',
  sessionPublicKey: sessionKeyPair.publicKey,
  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  nonce: crypto.randomUUID()
};

const authMessageString = JSON.stringify(authMessage);

// Sign with wallet private key (ONE TIME)
const walletSignature = await signMessage(walletPrivateKey, authMessageString);

// Send to backend to create session
const response = await fetch('/auth/session', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: walletPublicKey,
    message: authMessageString,
    signature: walletSignature
  })
});

const { sessionToken } = await response.json();

// Store session token (short-lived, client-side only)
sessionStorage.setItem('sessionToken', sessionToken);
sessionStorage.setItem('sessionPrivateKey', sessionKeyPair.privateKey);
```

**2. Use session key for subsequent actions:**
```typescript
// User clicks like button (NO wallet signature needed)
const sessionToken = sessionStorage.getItem('sessionToken');
const sessionPrivateKey = sessionStorage.getItem('sessionPrivateKey');

const actionMessage = {
  action: 'like',
  submissionId: 'submission-uuid',
  timestamp: Date.now()
};

const actionMessageString = JSON.stringify(actionMessage);

// Sign with ephemeral session key (FAST, no wallet unlock)
const sessionSignature = await signMessage(sessionPrivateKey, actionMessageString);

await fetch('/submissions/{id}/likes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: actionMessageString,
    signature: sessionSignature
  })
});
```

**3. Backend session management:**
```typescript
// Create session endpoint
app.post('/auth/session', async (req, res) => {
  const { walletAddress, message, signature } = req.body;

  // 1. Verify wallet signature
  if (!verifySignature(walletAddress, message, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Parse message
  const parsed = JSON.parse(message);

  // 3. Verify not expired
  if (parsed.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Session expiration too far in future' });
  }

  // 4. Create session in database
  const session = await createSession({
    walletAddress: walletAddress,
    sessionPublicKey: parsed.sessionPublicKey,
    expiresAt: new Date(parsed.expiresAt),
    createdAt: new Date()
  });

  // 5. Generate session token (JWT or random)
  const sessionToken = generateToken(session.id);

  res.json({ sessionToken });
});

// Like endpoint with session auth
app.post('/submissions/:id/likes', async (req, res) => {
  // 1. Extract session token
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token' });
  }

  // 2. Verify session exists and not expired
  const session = await getSessionByToken(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Session expired' });
  }

  // 3. Verify action signature with session public key
  const { message, signature } = req.body;
  if (!verifySignature(session.sessionPublicKey, message, signature)) {
    return res.status(401).json({ error: 'Invalid session signature' });
  }

  // 4. Parse message and verify timestamp
  const parsed = JSON.parse(message);
  if (Math.abs(Date.now() - parsed.timestamp) > 60000) {
    return res.status(401).json({ error: 'Request expired' });
  }

  // 5. Create like with wallet address from session
  const like = await createLike(session.walletAddress, req.params.id);
  res.json(like);
});
```

**Pros:**
- **Best UX:** User signs ONCE per session (24 hours)
- Fast likes: No wallet signature, just session key (< 1ms)
- Secure: Session key stored client-side only, expires automatically
- Stateful: Backend can revoke sessions (logout, suspicious activity)
- Scalable: Session verification faster than wallet signature verification
- Rate limiting: Can limit actions per session, not just per IP

**Cons:**
- More complex architecture (session table, token management)
- Session key stored in sessionStorage (vulnerable to XSS)
- Requires secure token generation (JWT or cryptographically secure random)
- Must implement session cleanup (expire old sessions)
- Adds session management overhead

**Implementation Effort:**
- Frontend: +100 lines (session creation, token storage, key management)
- Backend: +200 lines (session CRUD, token verification, cleanup jobs)
- Database: Sessions table (walletAddress, sessionPublicKey, expiresAt, etc.)
- Testing: Session creation, expiration, revocation, token security

**Security Considerations:**
- Session tokens must be cryptographically secure (not predictable)
- HTTPS required (prevent session token interception)
- XSS protection (sanitize all user input, use Content-Security-Policy)
- Session key never leaves client (only session token sent to backend)
- Wallet private key never exposed (only used once for session creation)

### Comparison: Signed Actions vs Session Key

| Feature | Signed Actions | Session Key |
|---------|---------------|-------------|
| **UX** | ⚠️ Sign every action | ✅ Sign once per session |
| **Security** | ✅ Stateless, no sessions | ✅ Stateful, revocable |
| **Performance** | ⚠️ Slow (verify signature each time) | ✅ Fast (verify token once) |
| **Complexity** | 🟡 Medium (signature + nonce) | 🔴 High (sessions + tokens + keys) |
| **Rate Limiting** | ⚠️ Per wallet or IP | ✅ Per session (more granular) |
| **Offline Support** | ❌ Requires wallet for each action | ⚠️ Works until session expires |
| **Mobile UX** | ❌ Unlock wallet every action | ✅ Unlock wallet once |
| **Implementation Time** | ~4-6 hours | ~8-12 hours |

### Recommendation

**For MVP (Current PR):**
- **Keep current implementation** (no authentication)
- Document security limitations in LIKES_FEATURE_STATUS.md
- Add to technical debt (Priority 2-3)

**For Next PR (After Wallet Generation Fix):**
- **Implement Option 2: Session Key**
- Best balance of security and UX
- Aligns with Web3 principles (one signature = proof of ownership)
- Enables future features (comments, profile updates, etc.)

**Rationale:**
- Current implementation works for MVP (demonstrates feature)
- Authentication can be added later without breaking changes
- Session key provides better UX than signed actions
- Session key infrastructure useful for future auth needs

---

## Implementation Priority

### Phase 1: Performance Optimization (High Priority)
**Blocking issues that affect scalability**

1. **Add like data to Submission responses** (Priority 1)
   - Modify backend: `GET /submissions/{id}` → include `likeCount`, `isLikedByCurrentUser`
   - Modify backend: `GET /chains/{id}/submissions` → include like data
   - Modify frontend: Use like data from submission, remove separate API calls
   - **Impact:** 95% reduction in API calls
   - **Effort:** ~8-16 hours (backend + frontend changes)

2. **Add batch like endpoint** (Priority 2)
   - Create backend: `POST /submissions/likes/batch`
   - Modify frontend: Batch requests for lazy-loaded submissions
   - **Impact:** N×2 calls → 1 call for dynamic content
   - **Effort:** ~4-6 hours

### Phase 2: Authentication (Medium Priority)
**Security improvements, not blocking MVP**

3. **Implement session key authentication** (Priority 3)
   - Create backend: `POST /auth/session`, session management
   - Modify backend: All write endpoints use session auth
   - Create frontend: Session creation flow, key management
   - **Impact:** Secure likes, prevent abuse
   - **Effort:** ~12-20 hours

### Phase 3: Features (Low Priority)
**Nice-to-have features for engagement**

4. **Get user likes endpoint** (Priority 4)
   - Create backend: `GET /users/{address}/likes`
   - Create frontend: "My Likes" page
   - **Impact:** User engagement, profile views
   - **Effort:** ~4-8 hours

5. **Top liked submissions endpoint** (Priority 5)
   - Create backend: `GET /submissions/top-liked`
   - Create frontend: Leaderboard/trending page
   - **Impact:** Gamification, discovery
   - **Effort:** ~6-10 hours

### Total Effort Estimate
- **Phase 1 (Must Have):** 12-22 hours
- **Phase 2 (Should Have):** 12-20 hours
- **Phase 3 (Nice to Have):** 10-18 hours
- **Total:** 34-60 hours (1-1.5 weeks of development)

---

## Future Considerations

### Real-Time Updates

**Problem:** Like counts become stale (User A likes → User B doesn't see update)

**Solutions:**
1. **WebSocket / Server-Sent Events (SSE)**
   - Backend broadcasts like events to all connected clients
   - Clients update like counts in real-time
   - Effort: +20 hours (infrastructure + client implementation)

2. **Polling**
   - Client periodically refetches like data (every 30-60 seconds)
   - Simple but inefficient (unnecessary API calls)
   - Effort: +2 hours

3. **Optimistic + Refresh Button**
   - Keep optimistic updates
   - Add "Refresh" button for manual update
   - Effort: +1 hour

**Recommendation:** Start with #3, implement #1 when user base grows

### Caching Strategy

**Backend Caching:**
- Cache like counts in Redis (invalidate on like/unlike)
- Cache top liked submissions (refresh every 5 minutes)
- Cache user like checks (short TTL: 60 seconds)

**Frontend Caching:**
- Cache submission data + likes in React Query / SWR
- Stale-while-revalidate pattern
- Background refresh on focus

**Effort:** +8-12 hours

### Analytics

**Track Engagement:**
- Like/unlike events → analytics platform
- A/B test like button designs, positions
- Track like velocity (likes per hour)
- Identify trending submissions

**Implementation:**
- Frontend: Add analytics events
- Backend: Stream events to analytics service
- Dashboard: Visualize engagement metrics

**Effort:** +4-8 hours

### Spam Prevention

**Rate Limiting:**
- Max 100 likes per session per day
- Max 10 likes per minute (prevent spam bots)
- Exponential backoff on repeated attempts

**Bot Detection:**
- Require CAPTCHA after X likes
- Detect patterns (liking every submission sequentially)
- Shadowban suspicious accounts (likes don't count)

**Effort:** +6-10 hours

---

## Appendix: API Examples

### Example 1: Ideal Chain View Load

**Current Implementation (PR #26):**
```typescript
// 1. Fetch submissions (1 API call)
const submissions = await getChainSubmissions(chainId); // 20 submissions

// 2. Fetch like data for each submission (40 API calls)
for (const submission of submissions) {
  const count = await getLikeCount(submission.id);        // 20 calls
  const liked = await checkUserLiked(submission.id, addr); // 20 calls
}

// Total: 41 API calls, ~8 seconds on 3G
```

**With Ideal API (Priority 1):**
```typescript
// 1. Fetch submissions WITH like data (1 API call)
const submissions = await getChainSubmissions(chainId, {
  headers: { 'X-Wallet-Address': walletAddress }
});

// submissions[0].likeCount = 42
// submissions[0].isLikedByCurrentUser = true

// Total: 1 API call, ~200ms on 3G
```

**Improvement: 95% reduction in API calls, 40x faster load time**

### Example 2: Ideal Batch Request

**Use Case:** Infinite scroll loads more submissions

```typescript
// User scrolls, load 20 more submissions
const newSubmissions = await loadMore(); // Returns submissions WITHOUT like data

// Batch fetch like data for new submissions
const submissionIds = newSubmissions.map(s => s.id);
const likesData = await fetchLikesBatch(submissionIds, walletAddress);

// Merge like data
newSubmissions.forEach(submission => {
  submission.likeCount = likesData[submission.id].count;
  submission.isLikedByCurrentUser = likesData[submission.id].isLiked;
});

// Total: 2 API calls (1 for submissions, 1 for likes)
// vs 41 API calls with current implementation
```

### Example 3: Session Key Flow

**User Journey:**
```
1. User visits app
   → Frontend: Check if session exists in sessionStorage
   → No session → Create new session

2. Create session (ONE TIME)
   → Frontend: Generate ephemeral key pair (client-side)
   → Frontend: Sign session creation message with wallet key
   → Backend: Verify wallet signature
   → Backend: Store session (walletAddress + sessionPublicKey + expiry)
   → Backend: Return session token
   → Frontend: Store token + ephemeral private key (sessionStorage)

3. User likes submission (FAST)
   → Frontend: Sign action message with ephemeral key (< 1ms, no wallet unlock)
   → Backend: Verify session token exists and not expired
   → Backend: Verify action signature with sessionPublicKey
   → Backend: Create like with walletAddress from session

4. Session expires after 24 hours
   → Repeat step 2 (user signs again)

5. User logs out
   → Frontend: Clear sessionStorage
   → Backend: Optionally revoke session (delete from database)
```

**Security Properties:**
- Wallet private key used once per session (minimal exposure)
- Session key never leaves client (stored in sessionStorage)
- Session token can be revoked (logout, suspicious activity)
- Short-lived sessions (24 hours) limit blast radius
- Action signatures prevent CSRF (cross-site request forgery)

---

## Summary

### What We Built (PR #26)
- ✅ Basic likes feature with 4 API endpoints
- ✅ Optimistic updates for good UX
- ✅ Error handling for common cases
- ⚠️ No authentication (trust walletAddress from client)
- ❌ N+1 query problem (2 API calls per submission)
- ❌ Not scalable beyond 50 submissions per page

### What We Should Build Next
1. **Priority 1:** Add like data to submission responses (1 API call instead of 40)
2. **Priority 2:** Batch like endpoint for dynamic content
3. **Priority 3:** Session key authentication (secure + good UX)
4. **Priority 4:** User likes endpoint ("My Likes" page)
5. **Priority 5:** Top liked submissions (leaderboard)

### What We Would Do With Unlimited Time
- Real-time updates (WebSockets)
- Advanced caching (Redis + client-side)
- Analytics dashboard
- Spam prevention (rate limiting, bot detection)
- Notifications (someone liked your submission)
- Social features (see who liked, like from notification)

### Estimated Effort
- **Phase 1 (Performance):** 12-22 hours → 95% reduction in API calls
- **Phase 2 (Security):** 12-20 hours → Secure authentication
- **Phase 3 (Features):** 10-18 hours → Engagement features
- **Total:** 34-60 hours (1-1.5 weeks)

---

**Last Updated:** 2025-10-28
**Next Steps:**
1. Review this document with backend team
2. Get buy-in for Phase 1 (performance) → highest impact
3. Create backend PR for like data in submissions
4. Update frontend to use new API
5. Plan Phase 2 (security) for follow-up
