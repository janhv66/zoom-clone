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

zoom-clone/
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/
└── README.md

## Getting Started

### Backend

cd backend
python -m venv venv

Activate the virtual environment.

macOS/Linux:

source venv/bin/activate

Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the backend:

uvicorn app.main:app --reload

The backend runs at:

http://localhost:8000

### Frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend runs at:

http://localhost:3000

Open http://localhost:3000 in your browser.

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