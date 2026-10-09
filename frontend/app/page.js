'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import MeetingRow from '@/components/MeetingRow';
import JoinModal from '@/components/JoinModal';
import ScheduleModal from '@/components/ScheduleModal';
import { api } from '@/lib/api';

const NOTICES = { ended: 'The meeting has been ended by the host.', removed: 'You have been removed from the meeting.' };

export default function Home() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [modal, setModal] = useState(null);
  const [now, setNow] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([api.upcoming(), api.recent()]);
    setUpcoming(u); setRecent(r);
  }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    if (!localStorage.getItem('zoom_token')) {
      router.replace('/login');
      return;
    }

    setNow(new Date());

    const t = setInterval(() => setNow(new Date()), 15000);

    api.me()
      .then(setMe)
      .catch(() => {
        localStorage.removeItem('zoom_token');
        localStorage.removeItem('zoom_user');
        router.replace('/login');
      });

    load().catch((e) => {
      if (e.message === 'Authentication required.' || e.message.includes('token')) {
        localStorage.removeItem('zoom_token');
        localStorage.removeItem('zoom_user');
        router.replace('/login');
        return;
      }

      flash('Could not reach the server.');
    });

    const n = new URLSearchParams(window.location.search).get('notice');
    if (NOTICES[n]) flash(NOTICES[n]);

    return () => clearInterval(t);
  }, [load, router]);

  async function startAsHost(m) {
    try {
      const r = await api.join(m.code, { display_name: me.name, as_host: true });
      sessionStorage.setItem(`zoom_pid_${m.code}`, r.participant.id);
      router.push(`/meeting/${m.code}`);
    } catch (e) { flash(e.message); }
  }
  const newMeeting = async () => { try { startAsHost(await api.instant()); } catch (e) { flash(e.message); } };
  const remove = async (m) => { await api.remove(m.code); load(); };

  return (
    <>
      <Header user={me} />
      <main className="home">
        <section className="left">
          <div className="tiles">
            <button className="tile" onClick={newMeeting}><span className="tile-icon orange"><Icon name="video" size={34} /></span>New meeting</button>
            <button className="tile" onClick={() => setModal('join')}><span className="tile-icon"><Icon name="plus" size={34} /></span>Join</button>
            <button className="tile" onClick={() => setModal('schedule')}><span className="tile-icon"><Icon name="calendar" size={34} /></span>Schedule</button>
            <button className="tile" onClick={() => flash('Screen sharing is available inside a meeting.')}><span className="tile-icon"><Icon name="share" size={34} /></span>Share screen</button>
          </div>
        </section>

        <section className="card clock">
          <div className="clock-time">{now ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</div>
          <div className="clock-date">{now ? now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}</div>
        </section>

        <section className="card upcoming">
          <h3>Upcoming meetings</h3>
          {upcoming.length === 0 && <p className="empty">No upcoming meetings. Click Schedule to add one.</p>}
          {upcoming.map((m) => <MeetingRow key={m.id} m={m} onStart={startAsHost} onDelete={remove} onCopied={() => flash('Invitation copied to clipboard')} />)}
        </section>

        <section className="card recent">
          <h3>Recent meetings</h3>
          {recent.length === 0 && <p className="empty">No recent meetings.</p>}
          {recent.map((m) => <MeetingRow key={m.id} m={m} recent onCopied={() => flash('Invitation copied to clipboard')} />)}
        </section>
      </main>

      {modal === 'join' && <JoinModal onClose={() => setModal(null)} />}
      {modal === 'schedule' && <ScheduleModal onClose={() => setModal(null)} onCreated={load} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
