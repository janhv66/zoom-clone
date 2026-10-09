import Icon from './Icon';
import { copy, fmtDate, fmtRange, fmtTime, formatCode, invitationText, isToday } from '@/lib/format';

export default function MeetingRow({ m, recent, onStart, onDelete, onCopied }) {
  return (
    <div className="mrow">
      <div className="mtime">
        <strong>{recent ? fmtDate(m.ended_at) : isToday(m.scheduled_at) ? 'Today' : fmtDate(m.scheduled_at)}</strong>
        <span>{recent ? fmtTime(m.started_at) : fmtRange(m.scheduled_at, m.duration_min)}</span>
      </div>
      <div className="minfo">
        <div className="mtitle">{m.title} {m.status === 'live' && <span className="badge-live">In progress</span>}</div>
        <div className="msub">Meeting ID: {formatCode(m.code)}</div>
      </div>
      <div className="mactions">
        {!recent && <button className="btn btn-primary btn-sm" onClick={() => onStart(m)}>{m.status === 'live' ? 'Join' : 'Start'}</button>}
        <button className="icon-btn" title="Copy invitation" onClick={() => { copy(invitationText(m)); onCopied?.(); }}><Icon name="copy" size={18} /></button>
        {onDelete && <button className="icon-btn" title="Delete" onClick={() => onDelete(m)}><Icon name="trash" size={18} /></button>}
      </div>
    </div>
  );
}
