from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

import models
from database import SessionLocal


router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # meeting_code -> set of connected participant IDs
        self.connections: Dict[str, Set[int]] = {}

        # (meeting_code, participant_id) -> websocket
        self.websockets: Dict[tuple[str, int], WebSocket] = {}

    async def connect(
        self,
        code: str,
        participant_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()

        if code not in self.connections:
            self.connections[code] = set()

        self.connections[code].add(participant_id)
        self.websockets[(code, participant_id)] = websocket

    def disconnect(self, code: str, participant_id: int):
        if code in self.connections:
            self.connections[code].discard(participant_id)

            if not self.connections[code]:
                del self.connections[code]

        self.websockets.pop((code, participant_id), None)

    async def send_to(
        self,
        code: str,
        participant_id: int,
        message: dict,
    ):
        websocket = self.websockets.get((code, participant_id))

        if websocket:
            await websocket.send_json(message)

    async def broadcast(
        self,
        code: str,
        message: dict,
        exclude: int | None = None,
    ):
        participant_ids = list(self.connections.get(code, set()))

        for participant_id in participant_ids:
            if participant_id == exclude:
                continue

            websocket = self.websockets.get((code, participant_id))

            if websocket:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


def validate_participant(
    db: Session,
    code: str,
    participant_id: int,
):
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.code == code)
        .first()
    )

    if not meeting:
        return None, None

    participant = (
        db.query(models.Participant)
        .filter(
            models.Participant.id == participant_id,
            models.Participant.meeting_id == meeting.id,
            models.Participant.status == "joined",
        )
        .first()
    )

    if not participant:
        return meeting, None

    return meeting, participant


@router.websocket("/ws/meetings/{code}")
async def websocket_endpoint(
    websocket: WebSocket,
    code: str,
):
    participant_id_raw = websocket.query_params.get("participant_id")

    if not participant_id_raw:
        await websocket.close(code=1008)
        return

    try:
        participant_id = int(participant_id_raw)
    except ValueError:
        await websocket.close(code=1008)
        return

    db = SessionLocal()

    try:
        meeting, participant = validate_participant(
            db,
            code,
            participant_id,
        )

        if not meeting or not participant:
            await websocket.close(code=1008)
            return

        # Save the participants already connected BEFORE adding this user.
        existing_peers = list(manager.connections.get(code, set()))

        await manager.connect(
            code,
            participant_id,
            websocket,
        )

        # Tell the new participant who is already in the room.
        await manager.send_to(
            code,
            participant_id,
            {
                "type": "peers",
                "peers": existing_peers,
            },
        )

        # Tell everyone else that this participant joined.
        await manager.broadcast(
            code,
            {
                "type": "peer-joined",
                "participant_id": participant_id,
            },
            exclude=participant_id,
        )

        while True:
            message = await websocket.receive_json()

            message_type = message.get("type")

            # WebRTC offer
            if message_type == "offer":
                target = message.get("target")

                if target is not None:
                    await manager.send_to(
                        code,
                        int(target),
                        {
                            "type": "offer",
                            "from": participant_id,
                            "offer": message.get("offer"),
                        },
                    )

            # WebRTC answer
            elif message_type == "answer":
                target = message.get("target")

                if target is not None:
                    await manager.send_to(
                        code,
                        int(target),
                        {
                            "type": "answer",
                            "from": participant_id,
                            "answer": message.get("answer"),
                        },
                    )

            # ICE candidate
            elif message_type == "ice-candidate":
                target = message.get("target")

                if target is not None:
                    await manager.send_to(
                        code,
                        int(target),
                        {
                            "type": "ice-candidate",
                            "from": participant_id,
                            "candidate": message.get("candidate"),
                        },
                    )

            # Screen sharing state
            elif message_type == "screen-share":
                sharing = message.get("sharing", False)

                await manager.broadcast(
                    code,
                    {
                        "type": "screen-share",
                        "participant_id": participant_id,
                        "sharing": sharing,
                    },
                    exclude=participant_id,
                )

    except WebSocketDisconnect:
        manager.disconnect(code, participant_id)

        await manager.broadcast(
            code,
            {
                "type": "peer-left",
                "participant_id": participant_id,
            },
            exclude=participant_id,
        )

    except Exception:
        manager.disconnect(code, participant_id)

    finally:
        db.close()