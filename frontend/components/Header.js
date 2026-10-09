'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { initials } from '@/lib/format';

const NAV = [
  { label: 'Home', icon: 'home' },
  { label: 'Chat', icon: 'chat' },
  { label: 'Meetings', icon: 'video' },
  { label: 'Contacts', icon: 'contact' },
];

export default function Header({ user, activePage, onNavigate }) {
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
    <>
      <header className="top-header">
        <div className="workplace-brand">
          <a href="/" className="logo">
            zoom
          </a>

          <span className="brand-divider" />

          <strong>Workplace</strong>
        </div>

        <nav className="top-nav">
          <button>Discover Products <span>⌄</span></button>
          <button>Pricing</button>
        </nav>

        <div className="top-actions">
          <button className="top-arrow">‹</button>
          <button className="top-arrow">›</button>

          <button className="search-box">
            <Icon name="search" size={18} />
            <span>Search&nbsp; ⌘ + K</span>
          </button>

          <button className="admin-link">Admin Center</button>

          <button className="download-btn">
            Download
          </button>

          <button className="upgrade-btn">
            Upgrade
          </button>

          <button className="header-icon" title="Notifications">
            <Icon name="bell" size={19} />
          </button>

          <div className="profile-wrap">
            <button
              className="zoom-avatar"
              title={user?.name}
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {user ? initials(user.name) : ''}
              <span className="online-dot" />
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
        </div>
      </header>

      <aside className="zoom-sidebar">
        <div className="sidebar-items">
          {NAV.map((item) => (
            <button
              key={item.label}
              className={`sidebar-item ${
                activePage === item.label.toLowerCase() ? 'active' : ''
              }`}
              onClick={() => {
                if (item.label === 'Home') {
                  onNavigate('home');
                } else if (item.label === 'Meetings') {
                  onNavigate('meetings');
                } else {
                  // Keep these as visual placeholders for now.
                }
              }}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <button
          className="sidebar-item settings-item"
          onClick={(e) => e.preventDefault()}
        >
          <Icon name="gear" size={20} />
          <span>Settings</span>
        </button>
      </aside>
    </>
  );
}