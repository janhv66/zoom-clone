# Zoom Clone (Full-Stack)

A Zoom web-app clone: dashboard, instant meetings, join by ID/link, scheduling, and a meeting room with host controls.

## Tech stack
- **Frontend:** Next.js 14 (App Router, client-rendered SPA-style), plain CSS (no UI library)
- **Backend:** Python, FastAPI, SQLAlchemy 2
- **Database:** SQLite (auto-created and seeded on first start)

## Run locally
```bash
# Backend (http://localhost:8000, docs at /docs)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (http://localhost:3000)
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install && npm run dev
```
Env vars: backend `FRONTEND_URL`, `CORS_ORIGINS`, `DATABASE_URL`, `AUTH_SECRET_KEY`; frontend `NEXT_PUBLIC_API_URL`.

## Deploy
- Backend → Render/Railway: build `pip install -r backend/requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT` (root dir `backend`). Set `FRONTEND_URL` and `CORS_ORIGINS` to the Vercel URL.
- Frontend → Vercel (root dir `frontend`), set `NEXT_PUBLIC_API_URL` to the backend URL.
- Note: free hosts have ephemeral disks, so SQLite resets on redeploy; the seed re-populates it.

## Database schema
```
users (id, name, email*, password_hash, personal_meeting_id*, created_at)
  └─< meetings (id, code*, title, description, host_id→users, type[instant|scheduled],
                scheduled_at, duration_min, status[scheduled|live|ended],
                created_at, started_at, ended_at)
        └─< participants (id, meeting_id→meetings, user_id→users?, display_name,
                          role[host|participant], is_muted, is_video_on,
                          status[joined|left|removed], joined_at, left_at)
```
`code` is the public 10-digit Meeting ID (unique, indexed). Times are stored as UTC. Deleting a meeting cascades to its participants.

## Features
- Dashboard: New meeting / Join / Schedule tiles, clock card, Upcoming and Recent sections, navbar with profile/settings placeholders
- Authentication: signup/login with JWT-based authentication, protected dashboard, and logout
- Personal Meeting ID: each user receives a unique persistent 10-digit Personal Meeting ID
- Instant meeting: unique ID + invite link (`/j/<id>`), host goes straight to the room
- Join: Meeting ID or full invite link, existence validation, display-name step
- Schedule: title, description, date/time, duration, auto link, shown in Upcoming; copy invitation, delete
- Meeting room: real camera/microphone using getUserMedia, multi-user video/audio using WebRTC, participants panel, meeting info, timer, leave / end-for-all
- Host controls (bonus): Mute All, mute one, remove participant (removed users are kicked on next poll)
- Screen sharing: browser screen capture with WebRTC track replacement
- Responsive layout (desktop/tablet/mobile)

## API (see `/docs`)
`POST /api/auth/signup|login` · `GET /api/me` · `GET /api/meetings/upcoming|recent` · `POST /api/meetings/instant|schedule` · `GET|DELETE /api/meetings/{code}` · `POST /api/meetings/{code}/join|mute-all|end` · `GET /api/meetings/{code}/participants` · `POST /api/participants/{id}/state|leave|remove|mute`

## Assumptions
- Authentication is required for dashboard and meeting actions.
- Users can create accounts and receive a unique Personal Meeting ID.
- Meetings are associated with the authenticated host.
- Multiple authenticated users can join the same meeting.
- Invite-link joiners enter as participants.
- Hosts start instant meetings from the dashboard.
- Passcodes and waiting rooms are out of scope.
- Chat is not implemented yet.