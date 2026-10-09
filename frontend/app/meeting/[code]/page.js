'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import Icon from '@/components/Icon';
import JoinModal from '@/components/JoinModal';
import ScheduleModal from '@/components/ScheduleModal';
import { api } from '@/lib/api';

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
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [modal, setModal] = useState(null);
  const [now, setNow] = useState(null);
  const [toast, setToast] = useState('');

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
      <Header user={me} />

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

          {/* Zoom-style shortcuts */}
          <section className="quick-links">

            <button
              className="quick-link"
              onClick={() => flash('Recordings are not implemented yet.')}
            >
              <span className="quick-link-icon recording">
                <Icon name="video" size={17} />
              </span>
              <span>Recordings</span>
            </button>

            <button
              className="quick-link"
              onClick={() => flash('Summaries are not implemented yet.')}
            >
              <span className="quick-link-icon summary">
                <Icon name="file" size={17} />
              </span>
              <span>Summaries</span>
            </button>

            <button
              className="quick-link"
              onClick={() => flash('My Notes are not implemented yet.')}
            >
              <span className="quick-link-icon notes">
                <Icon name="edit" size={17} />
              </span>
              <span>My Notes</span>
            </button>

          </section>

          {/* Meetings */}
          <section className="calendar-card">

            <div className="calendar-header">

              <div className="calendar-title">
                Today,{' '}
                {now
                  ? now.toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })
                  : ''}
                <span>⌄</span>
              </div>

              <button
                className="calendar-expand"
                title="Open calendar"
              >
                ↗
              </button>

            </div>

            <div className="calendar-toolbar">

              <button className="today-pill">
                <Icon name="calendar" size={13} />
                Today
              </button>

              <button className="calendar-arrow">
                ‹
              </button>

              <button className="calendar-arrow">
                ›
              </button>

              <button
                className="calendar-more"
                onClick={() => flash('Calendar options')}
              >
                ···
              </button>

            </div>

            <div className="calendar-body">

              {upcoming.length === 0 ? (
                <>
                  <div className="empty-calendar-icon">
                    <Icon name="calendar" size={42} />
                  </div>

                  <div className="empty-calendar-title">
                    No meetings scheduled.
                  </div>

                  <button
                    className="empty-calendar-button"
                    onClick={() => setModal('schedule')}
                  >
                    Schedule a meeting
                  </button>
                </>
              ) : (
                <div className="meeting-list">

                  {upcoming.map((meeting) => (
                    <div
                      className="zoom-meeting-row"
                      key={meeting.id}
                    >
                      <div className="meeting-time">
                        <strong>
                          {formatMeetingTime(meeting.scheduled_at)}
                        </strong>

                        <span>
                          {meeting.duration_min} min
                        </span>
                      </div>

                      <div className="meeting-details">
                        <strong>{meeting.title}</strong>

                        <span>
                          Meeting ID:{' '}
                          {meeting.code
                            .replace(
                              /(\d{3})(?=\d)/g,
                              '$1 '
                            )}
                        </span>
                      </div>

                      <div className="meeting-actions">

                        <button
                          className="meeting-copy"
                          onClick={() =>
                            copyMeeting(meeting.code)
                          }
                          title="Copy invitation"
                        >
                          <Icon name="copy" size={17} />
                        </button>

                        <button
                          className="meeting-start"
                          onClick={() =>
                            startAsHost(meeting)
                          }
                        >
                          Start
                        </button>

                        <button
                          className="meeting-delete"
                          onClick={() =>
                            removeMeeting(meeting)
                          }
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
                          /(\d{3})(?=\d)/g,
                          '$1 '
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