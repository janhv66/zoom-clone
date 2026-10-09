'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCode } from '@/lib/format';

export default function PreJoin() {
  const { code } = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem('zoom_name') || '');
    api.meeting(code).then((m) => (m.status === 'ended' ? setError('This meeting has ended.') : setMeeting(m)))
      .catch((e) => setError(e.message));
  }, [code]);

  async function join(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await api.join(code, { display_name: name.trim() });
      localStorage.setItem('zoom_name', name.trim());
      sessionStorage.setItem(`zoom_pid_${r.meeting.code}`, r.participant.id);
      router.push(`/meeting/${r.meeting.code}`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="prejoin">
      <a className="logo" href="/">zoom</a>
      <div className="card prejoin-card">
        {error && !meeting ? (
          <><h2>Unable to join</h2><p className="error">{error}</p><a className="btn btn-primary" href="/">Back to home</a></>
        ) : !meeting ? <p className="empty">Checking meeting…</p> : (
          <form onSubmit={join} className="form">
            <h2>Join meeting</h2>
            <p className="msub"><strong>{meeting.title}</strong><br />Host: {meeting.host_name} · ID {formatCode(meeting.code)}</p>
            <label>Your name<input autoFocus maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" /></label>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={!name.trim() || busy}>Join</button>
          </form>
        )}
      </div>
    </div>
  );
}
