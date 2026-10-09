from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ScheduleIn(BaseModel):
    title: str = Field(max_length=120)
    description: str = Field(default="", max_length=2000)
    scheduled_at: datetime
    duration_min: int = Field(ge=5, le=1440)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title is required")
        return v


class JoinIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=60)
    as_host: bool = False


class ActorIn(BaseModel):
    actor_id: int


class StateIn(BaseModel):
    is_muted: Optional[bool] = None
    is_video_on: Optional[bool] = None


class LeaveIn(BaseModel):
    end_meeting: bool = False
