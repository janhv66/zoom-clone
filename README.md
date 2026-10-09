# Zoom Clone — Video Conferencing Platform

A full-stack Zoom-inspired video conferencing platform built as an SDE Fullstack Assignment.

The application provides a Zoom-style dashboard where users can create, join, schedule, and manage meetings, along with real-time video conferencing and host controls.

---

## Tech Stack

### Frontend

- Next.js 14
- React
- JavaScript
- CSS
- WebRTC

### Backend

- FastAPI
- Python
- SQLAlchemy
- SQLite
- JWT Authentication
- PBKDF2 Password Hashing

### Testing / Development

- Playwright
- Git
- GitHub

---

## Features

### 1. Landing Dashboard

The application provides a professional Zoom-inspired dashboard with:

- Zoom-style navigation and sidebar
- User profile menu
- Personal Meeting ID (PMI)
- New Meeting
- Join Meeting
- Schedule Meeting
- Upcoming meetings
- Calendar-based meeting view
- Recent meetings
- Copy meeting invitation
- Delete scheduled meetings
- Responsive layout

### 2. Authentication

Users can create an account and securely log in.

- User signup
- User login
- JWT-based authentication
- Password hashing using PBKDF2
- Authenticated API requests
- Persistent Personal Meeting ID (PMI)
- Profile information
- Logout

### 3. Instant Meetings

Users can create an instant meeting directly from the dashboard.

- Automatically generates a unique meeting ID
- Creates the meeting for the authenticated user
- Assigns the creator as host
- Opens the meeting room
- Supports multiple participants

### 4. Join Meetings

Users can join meetings using a meeting ID.

- Meeting ID validation
- Participant registration
- Display name support
- Host identification
- Join page for meeting links

### 5. Scheduled Meetings

Users can schedule meetings for a future date and time.

- Meeting title
- Scheduled date and time
- Duration
- Unique meeting ID
- Upcoming meetings list
- Calendar-based viewing
- Start scheduled meeting
- Delete scheduled meeting
- Copy meeting invitation

### 6. Video Conferencing

The meeting room supports real-time browser-based communication using WebRTC.

- Camera
- Microphone
- Multiple participants
- Participant tiles
- Participant state updates
- Join / leave handling
- Meeting controls

### 7. Host Controls

The meeting host can manage participants and the meeting.

- View participants
- Mute participants
- Mute all participants
- Remove participants
- End meeting
- Host-specific controls

### 8. Screen Sharing

Participants can share their screen using the browser's Screen Capture API.

---

## Application Structure

    zoom-clone/
    │
    ├── frontend/
    │   ├── app/
    │   │   ├── j/
    │   │   │   └── [code]/
    │   │   ├── meeting/
    │   │   │   └── [code]/
    │   │   ├── login/
    │   │   ├── page.js
    │   │   └── globals.css
    │   │
    │   ├── components/
    │   │   ├── Header.js
    │   │   ├── Icon.js
    │   │   ├── JoinModal.js
    │   │   ├── MeetingRow.js
    │   │   ├── ParticipantsPanel.js
    │   │   ├── ScheduleModal.js
    │   │   ├── VideoTile.js
    │   │   └── Modal.js
    │   │
    │   └── lib/
    │       ├── api.js
    │       └── format.js
    │
    ├── backend/
    │   ├── routers/
    │   │   ├── auth.py
    │   │   ├── meetings.py
    │   │   ├── participants.py
    │   │   └── signaling.py
    │   │
    │   ├── auth.py
    │   ├── database.py
    │   ├── main.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── seed.py
    │   └── services.py
    │
    ├── README.md
    └── .gitignore

---

## Database Design

The application uses SQLite with SQLAlchemy ORM.

### Users

Stores authenticated user accounts.

| Field | Description |
|---|---|
| id | Unique user ID |
| name | User's display name |
| email | Unique email address |
| password_hash | Hashed password |
| personal_meeting_id | Persistent 10-digit PMI |
| created_at | Account creation timestamp |

### Meetings

Stores meeting information.

| Field | Description |
|---|---|
| id | Unique meeting ID |
| code | Unique meeting code |
| title | Meeting title |
| host_id | Meeting host |
| scheduled_at | Scheduled date/time |
| duration_min | Meeting duration |
| status | Meeting status |
| created_at | Creation timestamp |
| ended_at | Meeting end timestamp |

### Participants

Stores participants connected to meetings.

| Field | Description |
|---|---|
| id | Participant ID |
| meeting_id | Associated meeting |
| user_id | Authenticated user when available |
| display_name | Participant name |
| is_host | Whether participant is host |
| joined_at | Join timestamp |
| left_at | Leave timestamp |
| is_muted | Microphone state |

---

## API Overview

### Authentication

    POST /api/auth/signup
    POST /api/auth/login
    GET  /api/me

### Meetings

    POST /api/meetings/instant
    POST /api/meetings/schedule
    GET  /api/meetings/upcoming
    GET  /api/meetings/recent
    GET  /api/meetings/{code}
    DELETE /api/meetings/{code}

### Participants and Host Controls

    POST /api/meetings/{code}/join
    GET  /api/meetings/{code}/participants
    POST /api/meetings/{code}/participants/{id}/mute
    DELETE /api/meetings/{code}/participants/{id}
    POST /api/meetings/{code}/mute-all
    POST /api/meetings/{code}/end

---

## Running Locally

### 1. Clone the Repository

    git clone https://github.com/janhv66/zoom-clone.git
    cd zoom-clone

### 2. Start the Backend

    cd backend

    python -m venv .venv

Activate the virtual environment.

#### macOS / Linux

    source .venv/bin/activate

#### Windows

    .venv\Scripts\activate

Install dependencies:

    pip install -r requirements.txt

Start the FastAPI server:

    uvicorn main:app --reload --port 8000

Backend:

    http://localhost:8000

FastAPI documentation:

    http://localhost:8000/docs

### 3. Start the Frontend

Open another terminal:

    cd frontend
    npm install
    npm run dev

Frontend:

    http://localhost:3000

---

## Environment Variables

### Frontend

Create:

    frontend/.env.local

Add:

    NEXT_PUBLIC_API_BASE=http://localhost:8000/api

### Backend

For production, configure:

    AUTH_SECRET_KEY=your-secure-secret-key

Do not commit secrets or environment files to GitHub.

---

## Authentication Flow

1. User creates an account through Signup.
2. The backend hashes the password using PBKDF2.
3. The backend creates a JWT after successful authentication.
4. The frontend stores the authentication token.
5. API requests include the JWT as a Bearer token.
6. The backend validates the token and identifies the authenticated user.
7. User-specific meetings and Personal Meeting ID are returned for that account.

---

## Meeting Flow

### Instant Meeting

    Dashboard
        ↓
    New Meeting
        ↓
    Backend creates meeting
        ↓
    User joins as host
        ↓
    Meeting Room

### Scheduled Meeting

    Dashboard
        ↓
    Schedule
        ↓
    Meeting details
        ↓
    Backend creates scheduled meeting
        ↓
    Upcoming Meetings
        ↓
    Start
        ↓
    Meeting Room

### Join Meeting

    Dashboard
        ↓
    Join
        ↓
    Enter Meeting ID
        ↓
    Backend validates meeting
        ↓
    Participant joins
        ↓
    Meeting Room

---

## WebRTC

The meeting room uses WebRTC for browser-based real-time media communication.

The application handles:

- Local camera stream
- Local microphone stream
- Remote participant streams
- Peer connections
- Participant join / leave events
- Camera and microphone state
- Screen sharing

---

## Design Approach

The frontend follows a Zoom-inspired interface while remaining an original implementation.

The dashboard uses:

- Light neutral workspace
- White content cards
- Blue primary actions
- Sidebar navigation
- Rounded UI elements
- Calendar and meeting cards
- Profile menu
- Responsive layouts

The dashboard is designed as a single-page experience, while meeting rooms remain separate routes for the actual conferencing experience.

---

## Current Status

### Completed

- [x] Zoom-style landing dashboard
- [x] User signup
- [x] User login
- [x] JWT authentication
- [x] Personal Meeting ID
- [x] Instant meeting creation
- [x] Join meeting
- [x] Schedule meeting
- [x] Upcoming meetings
- [x] Recent meetings
- [x] Meeting calendar
- [x] Video conferencing
- [x] Participant management
- [x] Host controls
- [x] Mute all participants
- [x] Remove participant
- [x] End meeting
- [x] Screen sharing
- [x] Meeting invitation copying
- [x] Responsive UI

### In Progress

- [ ] Complete Personal Meeting ID start flow
- [ ] Additional dashboard navigation sections
- [ ] Final UI polish
- [ ] Deployment
- [ ] Final testing and documentation

---

## Assumptions

- Authentication is required for the main application.
- Each registered user receives a unique persistent Personal Meeting ID.
- Meeting creators are automatically assigned as hosts.
- SQLite is used for local development.
- WebRTC communication requires browser permissions for camera and microphone.
- Screen sharing depends on browser support and user permission.
- The application is intended as an educational SDE full-stack assignment and is not a production Zoom replacement.

---

## Future Improvements

- Production-grade WebSocket authentication
- Persistent production database
- HTTPS deployment
- Refresh-token based authentication
- Chat functionality
- Contact management
- Recurring meetings
- Waiting room
- Meeting recording
- Advanced meeting permissions

---

## Author

**Janhvi Arora**

GitHub: https://github.com/janhv66

---

## License

This project was developed as a full-stack engineering assignment and educational project.