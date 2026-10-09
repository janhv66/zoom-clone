'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { initials } from '@/lib/format';

const NAV = ['Home', 'Meetings', 'Team Chat', 'Mail', 'Calendar', 'Docs'];

export default function Header({ user }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  function logout() {
    localStorage.removeItem('zoom_token');
    localStorage.removeItem('zoom_user');
    router.push('/login');
  }

  async function copyPMI() {
    if (!user?.personal_meeting_id) return;

    await navigator.clipboard.writeText(user.personal_meeting_id);
    setProfileOpen(false);
  }

  return (
    <header className="header">
      <a className="logo" href="/">zoom</a>

      <nav className="nav">
        {NAV.map((n, i) => (
          <a
            key={n}
            className={i === 0 ? 'active' : ''}
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            {n}
          </a>
        ))}
      </nav>

      <div className="header-right">
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={20} />
        </button>

        <button className="icon-btn" title="Settings">
          <Icon name="gear" size={20} />
        </button>

        <button
          className="avatar"
          title={user?.name}
          onClick={() => setProfileOpen(!profileOpen)}
        >
          {user ? initials(user.name) : ''}
        </button>

        {profileOpen && (
          <div className="profile-menu">
            <div className="profile-name">{user?.name}</div>
            <div className="profile-email">{user?.email}</div>

            <div className="profile-pmi">
              <span>Personal Meeting ID</span>
              <strong>{user?.personal_meeting_id}</strong>
            </div>

            <button className="profile-copy" onClick={copyPMI}>
              Copy Meeting ID
            </button>

            <button className="profile-logout" onClick={logout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}