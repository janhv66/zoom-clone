import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import { api } from '@/lib/api';
import { parseCode } from '@/lib/format';

export default function JoinModal({ onClose }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const code = parseCode(value);
    if (!code) return setError('Enter a valid Meeting ID (9-11 digits) or invite link.');
    setBusy(true);
    try {
      const m = await api.meeting(code); // validates the meeting exists
      if (m.status === 'ended') throw new Error('This meeting has ended.');
      router.push(`/j/${m.code}`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal title="Join meeting" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>Meeting ID or invite link
          <input autoFocus value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} placeholder="e.g. 823 456 7890" />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!value.trim() || busy}>Join</button>
        </div>
      </form>
    </Modal>
  );
}
