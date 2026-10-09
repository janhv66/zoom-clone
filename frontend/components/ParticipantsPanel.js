import Icon from './Icon';
import { colorFor, initials } from '@/lib/format';

export default function ParticipantsPanel({ list, myId, isHost, onMuteAll, onMute, onRemove, onClose }) {
  return (
    <aside className="panel">
      <div className="panel-head"><span>Participants ({list.length})</span>
        <button className="icon-btn light" onClick={onClose}><Icon name="x" size={18} /></button></div>
      <div className="panel-list">
        {list.map((p) => (
          <div className="prow" key={p.id}>
            <div className="pav" style={{ background: colorFor(p.display_name) }}>{initials(p.display_name)}</div>
            <div className="pname">{p.display_name}{p.id === myId ? ' (Me)' : ''}
              {p.role === 'host' && <small>Host</small>}</div>
            {isHost && p.role !== 'host' && (
              <div className="pactions">
                {!p.is_muted && <button className="chip" onClick={() => onMute(p)}>Mute</button>}
                <button className="chip danger" onClick={() => onRemove(p)}>Remove</button>
              </div>
            )}
            <span className="pstate"><Icon name={p.is_muted ? 'micoff' : 'mic'} size={16} /><Icon name={p.is_video_on ? 'video' : 'videooff'} size={16} /></span>
          </div>
        ))}
      </div>
      {isHost && <div className="panel-foot"><button className="chip wide" onClick={onMuteAll}>Mute All</button></div>}
    </aside>
  );
}
