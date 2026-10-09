'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import Icon from '@/components/Icon';
import JoinModal from '@/components/JoinModal';
import ScheduleModal from '@/components/ScheduleModal';
import { api } from '@/lib/api';
import MeetingRow from '@/components/MeetingRow';

const NOTICES = {
  ended: 'The meeting has been ended by the host.',
  removed: 'You have been removed from the meeting.',
};

function formatMeetingDate(date) {
  if (!date) return '';

  return new Date(date).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatMeetingTime(date) {
  if (!date) return '';

  return new Date(date).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Home() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [modal, setModal] = useState(null);
  const [now, setNow] = useState(null);
  const [toast, setToast] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([
      api.upcoming(),
      api.recent(),
    ]);

    setUpcoming(u);
    setRecent(r);
  }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const calendarMeetings = useMemo(() => {
  const selected = calendarDate.toDateString();

  return upcoming.filter((m) => {
    if (!m.scheduled_at) return false;

    return new Date(m.scheduled_at).toDateString() === selected;
  });
}, [upcoming, calendarDate]);

function moveCalendar(days) {
  setCalendarDate((current) => {
    const next = new Date(current);
    next.setDate(next.getDate() + days);
    return next;
  });
}

function goToday() {
  setCalendarDate(new Date());
}

  useEffect(() => {
    if (!localStorage.getItem('zoom_token')) {
      router.replace('/login');
      return;
    }

    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);

    api.me()
      .then(setMe)
      .catch(() => {
        localStorage.removeItem('zoom_token');
        localStorage.removeItem('zoom_user');
        router.replace('/login');
      });

    load().catch((e) => {
      if (
        e.message === 'Authentication required.' ||
        e.message.toLowerCase().includes('token')
      ) {
        localStorage.removeItem('zoom_token');
        localStorage.removeItem('zoom_user');
        router.replace('/login');
        return;
      }

      flash('Could not reach the server.');
    });

    const notice = new URLSearchParams(window.location.search).get('notice');

    if (NOTICES[notice]) {
      flash(NOTICES[notice]);
    }

    return () => clearInterval(timer);
  }, [load, router]);

  async function startAsHost(meeting) {
    try {
      const result = await api.join(meeting.code, {
        display_name: me.name,
        as_host: true,
      });

      sessionStorage.setItem(
        `zoom_pid_${meeting.code}`,
        result.participant.id
      );

      router.push(`/meeting/${meeting.code}`);
    } catch (e) {
      flash(e.message);
    }
  }

  async function newMeeting() {
    try {
      const meeting = await api.instant();
      await startAsHost(meeting);
    } catch (e) {
      flash(e.message);
    }
  }

  async function removeMeeting(meeting) {
    try {
      await api.remove(meeting.code);
      await load();
    } catch (e) {
      flash(e.message);
    }
  }

  async function copyMeeting(code) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/j/${code}`
      );

      flash('Invitation copied to clipboard');
    } catch {
      flash('Could not copy invitation');
    }
  }

  return (
    <>
      <Header
        user={me}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {activePage === 'home' && (
      <main className="zoom-home">
        <div className="zoom-home-inner">

          {/* Clock */}
          <section className="welcome-clock">
            <div className="welcome-time">
              {now
                ? now.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : ''}
            </div>

            <div className="welcome-date">
              {now
                ? now.toLocaleDateString([], {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </div>
          </section>

          {/* Main actions */}
          <section className="home-actions">

            <button
              className="home-action"
              onClick={newMeeting}
            >
              <span className="home-action-icon orange">
                <Icon name="video" size={30} />
              </span>

              <span className="home-action-label">
                New meeting
                <span className="action-arrow">⌄</span>
              </span>
            </button>

            <button
              className="home-action"
              onClick={() => setModal('join')}
            >
              <span className="home-action-icon blue">
                <Icon name="plus" size={30} />
              </span>

              <span className="home-action-label">
                Join
              </span>
            </button>

            <button
              className="home-action"
              onClick={() => setModal('schedule')}
            >
              <span className="home-action-icon blue">
                <Icon name="calendar" size={30} />
              </span>

              <span className="home-action-label">
                Schedule
              </span>
            </button>

          </section>

          {/* Meetings */}
          <section className="calendar-card">

            <div className="calendar-header">
              <div className="calendar-title">
                {calendarDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

              <button
                className="calendar-expand"
                type="button"
                title="Calendar"
                onClick={() => flash('Calendar view is available for scheduled meetings.')}
              >
                ↗
              </button>
            </div>

            <div className="calendar-toolbar">

              <button
                className="today-pill"
                type="button"
                onClick={goToday}
              >
                <Icon name="calendar" size={14} />
                Today
              </button>

              <button
                className="calendar-arrow"
                type="button"
                onClick={() => moveCalendar(-1)}
                aria-label="Previous day"
              >
                ‹
              </button>

              <button
                className="calendar-arrow"
                type="button"
                onClick={() => moveCalendar(1)}
                aria-label="Next day"
              >
                ›
              </button>

              <button
                className="calendar-more"
                type="button"
                onClick={() => flash('Calendar options')}
              >
                •••
              </button>

            </div>

            <div className="calendar-body">

              {calendarMeetings.length === 0 ? (
                <>
                  <div className="empty-calendar-icon">
                    <Icon name="calendar" size={34} />
                  </div>

                  <div className="empty-calendar-title">
                    No meetings scheduled.
                  </div>

                  <button
                    className="empty-calendar-button"
                    type="button"
                    onClick={() => setModal('schedule')}
                  >
                    Schedule a meeting
                  </button>
                </>
              ) : (
                <div className="meeting-list">

                  {calendarMeetings.map((m) => (
                    <div className="zoom-meeting-row" key={m.id}>

                      <div className="meeting-time">
                        <strong>
                          {new Date(m.scheduled_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </strong>

                        <span>
                          {m.duration_min} min
                        </span>
                      </div>

                      <div className="meeting-details">
                        <strong>{m.title}</strong>

                        <span>
                          Meeting ID: {m.code}
                        </span>
                      </div>

                      <div className="meeting-actions">

                        <button
                          className="meeting-copy"
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(m.invite_link);
                            flash('Invitation copied to clipboard');
                          }}
                          title="Copy invitation"
                        >
                          <Icon name="copy" size={18} />
                        </button>

                        <button
                          className="meeting-start"
                          type="button"
                          onClick={() => startAsHost(m)}
                        >
                          Start
                        </button>

                        <button
                          className="meeting-delete"
                          type="button"
                          onClick={() => removeMeeting(m)}
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </section>

          {/* Recent meetings */}
          {recent.length > 0 && (
            <section className="recent-section">

              <div className="recent-section-header">
                <h3>Recent meetings</h3>
              </div>

              <div className="recent-list">

                {recent.map((meeting) => (
                  <div
                    className="recent-meeting-row"
                    key={meeting.id}
                  >
                    <div className="recent-date">
                      <strong>
                        {formatMeetingDate(
                          meeting.ended_at
                        )}
                      </strong>

                      <span>
                        {formatMeetingTime(
                          meeting.ended_at
                        )}
                      </span>
                    </div>

                    <div className="recent-details">
                      <strong>{meeting.title}</strong>

                      <span>
                        Meeting ID:{' '}
                        {meeting.code.replace(
                          /^(\d{3})(\d{3})(\d{4})$/,
                          '$1 $2 $3'
                        )}
                      </span>
                    </div>

                    <button
                      className="meeting-copy"
                      onClick={() =>
                        copyMeeting(meeting.code)
                      }
                      title="Copy invitation"
                    >
                      <Icon name="copy" size={17} />
                    </button>
                  </div>
                ))}

              </div>

            </section>
          )}

        </div>
      </main>
      )}

      {activePage === 'meetings' && (
  <main className="meetings-page">

    <section className="meetings-sidebar">
      <h3>Upcoming</h3>

      <div className="pmi-card">
        <strong>
          {me?.personal_meeting_id
            ? me.personal_meeting_id.replace(
              /^(\d{3})(\d{3})(\d{4})$/,
              '$1 $2 $3'
            )
            : '—'}
        </strong>

        <span>My Personal Meeting ID (PMI)</span>
      </div>

      {upcoming.length === 0 && (
        <p className="meetings-empty">
          No upcoming meetings
        </p>
      )}
    </section>

    <section className="meetings-content">

      <h1>My Personal Meeting ID (PMI)</h1>

      <div className="pmi-number">
        {me?.personal_meeting_id
          ? me.personal_meeting_id.replace(
            /^(\d{3})(\d{3})(\d{4})$/,
            '$1 $2 $3'
          )
          : '—'}
      </div>

      <div className="pmi-actions">

        <button
          className="btn btn-primary"
          onClick={() => flash('Personal meeting start will be connected next.')}
        >
          Start
        </button>

        <button
          className="btn meeting-secondary-btn"
          onClick={async () => {
            if (!me?.personal_meeting_id) return;

            await navigator.clipboard.writeText(
              me.personal_meeting_id
            );

            flash('Personal Meeting ID copied');
          }}
        >
          <Icon name="copy" size={15} />
          Copy Meeting ID
        </button>

      </div>

      <h2 className="meetings-section-title">
        Upcoming meetings
      </h2>

      {upcoming.length === 0 ? (
        <p className="empty">
          No upcoming meetings.
        </p>
      ) : (
        <div className="meetings-list">
          {upcoming.map((m) => (
            <MeetingRow
              key={m.id}
              m={m}
              onStart={startAsHost}
              onDelete={removeMeeting}
              onCopied={() =>
                flash('Invitation copied to clipboard')
              }
            />
          ))}
        </div>
      )}

    </section>

  </main>
)}

      {modal === 'join' && (
        <JoinModal
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'schedule' && (
        <ScheduleModal
          onClose={() => setModal(null)}
          onCreated={load}
        />
      )}

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </>
  );
}