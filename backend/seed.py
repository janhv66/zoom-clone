from datetime import timedelta

from sqlalchemy.orm import Session

from models import Meeting, Participant, User
from services import utcnow


def seed(db: Session):
    if db.query(User).first():
        return
    me = User(id=1, name="Alex Morgan", email="alex.morgan@example.com")
    db.add(me)
    db.flush()
    now = utcnow()

    def meeting(code, title, desc, start, dur, status="scheduled"):
        m = Meeting(code=code, title=title, description=desc, host_id=me.id, type="scheduled",
                    scheduled_at=start, duration_min=dur, status=status)
        if status == "ended":
            m.started_at, m.ended_at = start, start + timedelta(minutes=dur - 5)
        db.add(m)
        return m

    live = meeting("8234567890", "Product Design Review", "Weekly design critique.",
                   now - timedelta(minutes=10), 60, "live")
    live.started_at = now - timedelta(minutes=10)
    db.flush()
    for name, muted in [("Priya Sharma", False), ("Daniel Kim", True), ("Mei Tanaka", False)]:
        db.add(Participant(meeting_id=live.id, display_name=name, is_muted=muted))

    meeting("7345678901", "Sprint Planning", "Plan next sprint backlog.", now + timedelta(hours=5), 45)
    meeting("6456789012", "Client Onboarding Call", "Kickoff with Acme Corp.", now + timedelta(days=1, hours=2), 30)
    meeting("5567890123", "Quarterly Business Review", "Q3 results and Q4 roadmap.", now + timedelta(days=3), 90)
    meeting("4678901234", "Team Standup", "Daily sync.", now - timedelta(days=1, hours=1), 15, "ended")
    meeting("3789012345", "1:1 with Manager", "Career growth chat.", now - timedelta(days=2), 30, "ended")
    meeting("2890123456", "Marketing Sync", "Campaign review.", now - timedelta(days=4), 60, "ended")
    meeting("1901234567", "Engineering All-Hands", "Monthly all-hands.", now - timedelta(days=7), 60, "ended")
    db.commit()
