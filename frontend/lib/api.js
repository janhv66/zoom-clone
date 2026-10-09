const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zoom_token');
}
async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d[0]?.msg?.replace('Value error, ', '') : 'Something went wrong');
  }
  return data;
}
const post = (path, body = {}) => req(path, { method: 'POST', body });

export const api = {
  me: () => req('/api/me'),
  upcoming: () => req('/api/meetings/upcoming'),
  recent: () => req('/api/meetings/recent'),
  instant: () => post('/api/meetings/instant'),
  schedule: (b) => post('/api/meetings/schedule', b),
  meeting: (code) => req(`/api/meetings/${code}`),
  remove: (code) => req(`/api/meetings/${code}`, { method: 'DELETE' }),
  join: (code, b) => post(`/api/meetings/${code}/join`, b),
  participants: (code, me) => req(`/api/meetings/${code}/participants?me=${me}`),
  muteAll: (code, actor) => post(`/api/meetings/${code}/mute-all`, { actor_id: actor }),
  state: (pid, b) => post(`/api/participants/${pid}/state`, b),
  leave: (pid, end) => post(`/api/participants/${pid}/leave`, { end_meeting: end }),
  kick: (pid, actor) => post(`/api/participants/${pid}/remove`, { actor_id: actor }),
  mute: (pid, actor) => post(`/api/participants/${pid}/mute`, { actor_id: actor }),
  signup: (b) => post('/api/auth/signup', b),
  login: (b) => post('/api/auth/login', b),
};
