# Zoom Clone

A full-stack Zoom-like video conferencing application built with Next.js, React, FastAPI, WebRTC, and WebSockets.

## Features

- User signup and login
- JWT-based authentication
- Password hashing with PBKDF2
- Instant meeting creation
- Unique meeting IDs
- Join meetings using meeting ID or invite link
- Display name when joining
- Personal Meeting ID (PMI)
- Schedule meetings with topic, description, date, time, and duration
- Upcoming meetings
- Recent meetings
- Copy meeting invitation link
- End meetings
- Real-time video conferencing using WebRTC
- Microphone mute/unmute
- Camera start/stop
- Camera and microphone disabled by default when joining
- Screen sharing
- Participant list and participant count
- Real-time participant video
- Chat interface
- Reactions
- WebSocket-based signaling
- Host controls
- Mute all participants
- Remove participants
- End meeting for everyone
- Responsive desktop, tablet, and mobile UI
- Mobile More menu for secondary meeting controls
- Meeting timer

## Tech Stack

### Frontend

- Next.js
- React
- JavaScript
- CSS
- WebRTC
- WebSockets

### Backend

- FastAPI
- Python
- REST APIs
- WebSockets
- JWT authentication
- PBKDF2 password hashing

## Project Structure

```text
zoom-clone/
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.js
│   │   ├── meeting/
│   │   │   └── [code]/
│   │   │       └── page.js
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── Header.js
│   │   ├── Icon.js
│   │   ├── JoinModal.js
│   │   ├── MeetingRow.js
│   │   ├── Modal.js
│   │   ├── ParticipantsPanel.js
│   │   ├── ScheduleModal.js
│   │   └── VideoTile.js
│   ├── lib/
│   │   ├── api.js
│   │   └── format.js
│   ├── .env.example
│   ├── jsconfig.json
│   ├── next.config.js
│   ├── package.json
│   └── package-lock.json
│
├── backend/
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── meetings.py
│   │   ├── participants.py
│   │   └── signaling.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   ├── schemas.py
│   ├── seed.py
│   └── services.py
│
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

macOS/Linux:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

Open `http://localhost:3000` in your browser.

## Usage

1. Create an account or log in.
2. Click **New Meeting** to create an instant meeting.
3. Share the generated meeting link.
4. Join a meeting using the meeting ID or invite link.
5. Use the meeting toolbar to control your microphone and camera, view participants, chat, react, share your screen, and access host controls.
6. Hosts can mute participants, remove participants, or end the meeting for everyone.

## WebRTC

The application uses WebRTC for real-time peer-to-peer audio and video communication.

WebSockets are used for signaling and exchanging connection information between participants.

A STUN server is used for WebRTC connection establishment.

## Author

Janhvi