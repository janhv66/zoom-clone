'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.signup({ name, email, password });

      localStorage.setItem('zoom_token', data.token);
      localStorage.setItem('zoom_user', JSON.stringify(data.user));

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <section className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="logo">zoom</div>

          <h2 style={{ marginTop: '20px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>

          <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>
            {mode === 'login'
              ? 'Sign in to continue to your meetings'
              : 'Create your account and get your Personal Meeting ID'}
          </p>
        </div>

        <form className="form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={6}
              required
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px',
            color: 'var(--muted)',
          }}
        >
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                className="btn"
                style={{
                  border: 0,
                  padding: 0,
                  color: 'var(--blue)',
                  background: 'none',
                }}
                onClick={() => switchMode('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="btn"
                style={{
                  border: 0,
                  padding: 0,
                  color: 'var(--blue)',
                  background: 'none',
                }}
                onClick={() => switchMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}