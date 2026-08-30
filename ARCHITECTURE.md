# Architecture Decision Document & Phase 0 Audit: app.ng

## 1. Phase 0 — Audit Report

### Current Repository State
- **Framework / Language:** Currently an empty repository initialized with a standard git history (`Initial commit`). No existing source files, `package.json`, or configuration files are present.
- **Existing Auth:** None.
- **Existing Data Models:** None.
- **Existing Dependencies:** None.
- **Working / Missing Components:** 100% of the WhatsApp + Social Media + Business Platform feature set needs to be built from scratch.

---

## 2. Target Architecture Decision Document

### A. Technology Stack Overview
- **Frontend Framework:** Next.js (App Router, React 19 / 18, TypeScript) with Tailwind CSS and Lucide React icons.
- **Backend / API:** Next.js Route Handlers (Serverless/Edge Functions hosted on Vercel).
- **Database & ORM:** PostgreSQL (hosted on Neon or Supabase) with **Prisma ORM**.
- **Real-time Messaging Layer:** **Pusher Channel API / Supabase Realtime**.
  - *Justification:* Vercel Serverless Functions are ephemeral and short-lived; they cannot sustain persistent, long-lived WebSocket connections. Using a managed real-time service allows client-to-client or API-to-client instant message broadcasting via pub/sub channels without infrastructure management overhead.
- **Media Object Storage:** **Vercel Blob / Supabase Storage / AWS S3**.
  - *Justification:* Vercel's local filesystem is read-only and ephemeral in serverless environments. Media uploads (voice notes, images, videos, business catalogs) must be uploaded directly to object storage via presigned URLs or serverless upload tokens.
- **Authentication:** **NextAuth.js (Auth.js)** with Prisma Adapter or Supabase Auth, supporting credentials and OAuth providers.

---

## 3. Core Data Models Schema Overview (Prisma Entity Design)

1. **User:** `id`, `name`, `email`, `phone`, `passwordHash`, `image`, `bio`, `isBusiness`, `createdAt`, `updatedAt`
2. **BusinessProfile:** `id`, `userId`, `businessName`, `category`, `description`, `address`, `catalogItems` (JSON), `operatingHours`
3. **Contact / Connection:** `id`, `userId`, `contactId`, `status` (PENDING, ACCEPTED, BLOCKED)
4. **Conversation:** `id`, `type` (DIRECT, GROUP), `name`, `groupImage`, `createdAt`, `updatedAt`
5. **Message:** `id`, `conversationId`, `senderId`, `content`, `mediaUrl`, `mediaType` (IMAGE, VIDEO, AUDIO, DOCUMENT), `readBy` (JSON/Relation), `createdAt`
6. **Post:** `id`, `authorId`, `caption`, `mediaUrls`, `visibility` (PUBLIC, CONTACTS), `createdAt`
7. **Comment:** `id`, `postId`, `authorId`, `content`, `createdAt`
8. **Like / Reaction:** `id`, `postId`, `commentId`, `messageId`, `userId`, `emoji`
9. **Story:** `id`, `authorId`, `mediaUrl`, `caption`, `expiresAt` (24h default), `createdAt`
10. **Notification:** `id`, `userId`, `type` (MESSAGE, LIKE, COMMENT, CONNECTION_REQUEST), `data` (JSON), `isRead`, `createdAt`

---

## 4. Tradeoffs & Vercel Optimization Strategy

| Architectural Choice | Selected Approach | Tradeoff / Justification |
| :--- | :--- | :--- |
| **Real-time Engine** | Managed Pusher / Supabase Realtime | Avoids managing custom WebSocket / Socket.io server on external VPS while strictly abiding by Vercel serverless runtime constraints. |
| **Storage** | Object Storage (Vercel Blob / S3) | Uploads bypass API servers directly to cloud storage, conserving Vercel serverless execution time and bandwidth limit. |
| **Database Connection Pooling** | Neon Postgres / Prisma Accelerate | Handles high volume of serverless connection spikes safely with connection pooling. |

---

## 5. Implementation Roadmap
- **Phase 0 (Current):** Audit repo, finalize architecture decision doc, define `.env.example`.
- **Phase 1:** Initialize Next.js, Prisma data model, database connection, real-time proof-of-concept setup, media upload flow, and initial Vercel environment config.
- **Phase 2:** Core Messaging (1:1 & Group chats, real-time events, read receipts, voice notes).
- **Phase 3:** Social Media Features (Feed, Posts, Comments, Likes, 24h Stories).
- **Phase 4:** Business Platform Capabilities (Business Profiles, Product Catalogs, Direct Messaging with Businesses).
- **Phase 5:** Polishing, Final E2E Verification, & Vercel Deployment.
