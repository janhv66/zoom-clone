export const parseCode = (raw) => {
  const m = (raw || '').replace(/[\s-]/g, '').match(/\d{9,11}/);
  return m ? m[0] : null;
};
export const formatCode = (c) => (c || '').replace(/^(\d{3})(\d{3})(\d+)$/, '$1 $2 $3');
export const inviteLink = (c) => `${window.location.origin}/j/${c}`;
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtRange = (iso, mins) =>
  `${fmtTime(iso)} - ${fmtTime(new Date(new Date(iso).getTime() + mins * 60000))}`;
export const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();
export const invitationText = (m) =>
  `${m.host_name} is inviting you to a scheduled Zoom meeting.\n\nTopic: ${m.title}\n` +
  (m.scheduled_at ? `Time: ${fmtDate(m.scheduled_at)}, ${fmtRange(m.scheduled_at, m.duration_min)}\n` : '') +
  `\nJoin Zoom Meeting\n${inviteLink(m.code)}\n\nMeeting ID: ${formatCode(m.code)}`;
export const copy = (text) => navigator.clipboard?.writeText(text);
export const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const COLORS = ['#0b5cff', '#7b61ff', '#e5484d', '#12a594', '#d6409f', '#f76b15', '#3e63dd'];
export const colorFor = (n) => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
