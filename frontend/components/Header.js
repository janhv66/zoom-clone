import Icon from './Icon';
import { initials } from '@/lib/format';

const NAV = ['Home', 'Meetings', 'Team Chat', 'Mail', 'Calendar', 'Docs'];
export default function Header({ user }) {
  return (
    <header className="header">
      <a className="logo" href="/">zoom</a>
      <nav className="nav">
        {NAV.map((n, i) => <a key={n} className={i === 0 ? 'active' : ''} href="#" onClick={(e) => e.preventDefault()}>{n}</a>)}
      </nav>
      <div className="header-right">
        <button className="icon-btn" title="Notifications"><Icon name="bell" size={20} /></button>
        <button className="icon-btn" title="Settings"><Icon name="gear" size={20} /></button>
        <div className="avatar" title={user?.name}>{user ? initials(user.name) : ''}</div>
      </div>
    </header>
  );
}
