# QR Karaoke Queue System

A full-stack QR-based karaoke queue built with Next.js, TypeScript, Tailwind CSS, Supabase, Prisma migrations, and the official YouTube Data API / YouTube IFrame Player API.

## Features

- Admin login with environment-based credentials and protected admin pages.
- Host dashboard for creating sessions, QR links, guest request toggles, approval mode, queue clearing, and CSV history export.
- Mobile guest page at `/session/[sessionCode]` for singer names, local song search, YouTube search fallback, library save, and queue requests.
- Projector display at `/display/[sessionCode]` with the YouTube IFrame Player API, current singer, upcoming queue, marquee, and automatic next-song advance when a video ends.
- Queue management with approval, rejection, removal, move-to-top, drag-and-drop reorder, manual host add, skip, and duplicate prevention.
- Song library management with manual YouTube URL/video ID add, YouTube metadata search, favorites, inline title/artist editing, and deletion.
- Realtime-feeling queue updates via Server-Sent Events.
- Runtime backend data access through Supabase server SDK with a service-role key kept on the server.
- Server-side YouTube search only. The frontend never receives `YOUTUBE_API_KEY`.

## YouTube Compliance

The app stores only YouTube video IDs, titles, thumbnails, channel names, durations, and metadata. It does not download, rip, store, proxy, or bypass YouTube media. Playback uses embedded YouTube playback through the official IFrame Player API.

## Supabase Setup

Create a Supabase project, then use Supabase Postgres as the Prisma database.

1. Open the Supabase SQL Editor and run [supabase/prisma-user.sql](<supabase/prisma-user.sql>) after replacing `replace_with_a_strong_password`.

2. In Supabase, go to Project Settings > Database > Connect.
3. Copy the Supavisor Session pooler connection string. It uses port `5432`.
4. Change the user segment to `prisma.[PROJECT-REF]` and use the password from step 1.

Example shape:

```bash
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
```

Supabase’s direct connection can be IPv6-only. The session pooler is the safer default for local development and normal server deployments.

The app runtime uses the Supabase server SDK. Prisma is kept for schema and migration management only.

## Environment

Copy `.env.example` to `.env` and update values:

```bash
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
YOUTUBE_API_KEY=""
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
ADMIN_SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Setup

```bash
npm install
npm run supabase:check
npm run db:check
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000/admin` and sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## Optional Local Postgres

If you want to work without Supabase, use the included Docker Compose database and set `DATABASE_URL` to:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qr_karaoke?schema=public"
```

Then run:

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
```

Use `npm run prisma:migrate:dev` only when changing the Prisma schema and creating a new migration locally.

## Main Routes

- `/admin` - host dashboard and QR code.
- `/admin/queue` - queue control, drag reorder, approvals, manual add.
- `/admin/library` - local library and YouTube metadata search.
- `/session/[sessionCode]` - guest QR request page.
- `/display/[sessionCode]` - TV/projector karaoke display.
- `/display/active` - redirects to the currently active display session.

## Validation

```bash
npm run lint
npm run build
```
