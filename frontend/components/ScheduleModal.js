import { useState } from 'react';
import Modal from './Modal';
import { api } from '@/lib/api';
import { copy, formatCode, inviteLink, invitationText } from '@/lib/format';

const pad = (n) => String(n).padStart(2, '0');
function defaults() {
  const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
  return { title: '', description: '', date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:00`, hours: 1, minutes: 0 };
}

export default function ScheduleModal({ onClose, onCreated }) {
  const [f, setF] = useState(defaults);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const when = new Date(`${f.date}T${f.time}`);
    const duration = Number(f.hours) * 60 + Number(f.minutes);
    if (isNaN(when)) return setError('Pick a valid date and time.');
    if (when < new Date()) return setError('Start time must be in the future.');
    if (duration < 5) return setError('Duration must be at least 5 minutes.');
    setBusy(true);
    try {
      const m = await api.schedule({ title: f.title || 'My Meeting', description: f.description,
        scheduled_at: when.toISOString(), duration_min: duration });
      setCreated(m); onCreated();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (created) return (
    <Modal title="Meeting scheduled" onClose={onClose}>
      <div className="form">
        <p><strong>{created.title}</strong></p>
        <p className="msub">Meeting ID: {formatCode(created.code)}</p>
        <input readOnly value={inviteLink(created.code)} onFocus={(e) => e.target.select()} />
        <div className="modal-foot">
          <button className="btn" onClick={() => copy(invitationText(created))}>Copy invitation</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Schedule meeting" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>Topic<input autoFocus maxLength={120} value={f.title} onChange={set('title')} placeholder="My Meeting" /></label>
        <label>Description (optional)<textarea rows={3} value={f.description} onChange={set('description')} placeholder="Add a description" /></label>
        <div className="row">
          <label>Date<input type="date" value={f.date} onChange={set('date')} required /></label>
          <label>Time<input type="time" value={f.time} onChange={set('time')} required /></label>
        </div>
        <div className="row">
          <label>Hours<select value={f.hours} onChange={set('hours')}>{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => <option key={h}>{h}</option>)}</select></label>
          <label>Minutes<select value={f.minutes} onChange={set('minutes')}>{[0, 15, 30, 45].map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>Save</button>
        </div>
      </form>
    </Modal>
  );
}
