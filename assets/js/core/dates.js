// Pure date/time helpers. All dates are ISO strings YYYY-MM-DD (local, no timezone).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');

function build(y, m, d) {
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`;
}

function parts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function localDate(iso) {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d);
}

export function toISODate(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return build(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 1) return null;
    // Excel 1900 system: day 0 = 1899-12-30. Use UTC maths to avoid DST shifts.
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    return build(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  if (typeof value !== 'string') return null;
  const s = value.trim();
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return build(Number(m[3]), Number(m[2]), Number(m[1]));
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return build(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

export function toHHMM(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || value >= 1) return null;
    const total = Math.round(value * 1440);
    if (total >= 1440) return null;
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  }
  if (typeof value !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})\s*([ap]m)?$/i.exec(value.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3] && m[3].toLowerCase();
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === 'am' && h === 12) h = 0;
    else if (ap === 'pm' && h !== 12) h += 12;
  } else if (h > 23) return null;
  return `${pad(h)}:${pad(min)}`;
}

export function addDays(iso, n) {
  const [y, m, d] = parts(iso);
  const dt = new Date(y, m - 1, d + n);
  return build(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

export function daysBetween(fromIso, toIso) {
  const [fy, fm, fd] = parts(fromIso);
  const [ty, tm, td] = parts(toIso);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

export function weekday(iso) {
  return localDate(iso).getDay();
}

export function dayCode(iso) {
  return DAYS[weekday(iso)];
}

export function formatLong(iso) {
  const [y, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatShort(iso) {
  const [y, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

export function todayISO(search) {
  const m = /[?&]date=([^&]*)/.exec(search || '');
  if (m) {
    const iso = toISODate(decodeURIComponent(m[1]));
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(decodeURIComponent(m[1]).trim())) return iso;
  }
  const now = new Date();
  return build(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
