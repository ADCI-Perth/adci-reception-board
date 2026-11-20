import { formatLong } from './dates.js';

const up = s => String(s).toUpperCase();

function baseText(state) {
  const { mode, period, countdown } = state;
  const name = period ? up(period.name) : '';
  const d = countdown ? up(formatLong(countdown.target)) : '';
  const withDate = prefix => (d ? `${prefix} ${d}` : prefix);
  switch (mode) {
    case 'teaching': return name;
    case 'orientation': return 'ORIENTATION WEEK — WELCOME TO ADCI';
    case 'summer': return `SUMMER SEMESTER — ${name}`;
    case 'assessment': return 'ASSESSMENT WEEK — GOOD LUCK WITH YOUR ASSESSMENTS';
    case 'tuition': return withDate('TUITION-FREE WEEK — CLASSES RESUME');
    case 'study': return withDate('STUDY WEEK — EXAMS START');
    case 'exam': return 'EXAM WEEK IN PROGRESS — GOOD LUCK TO ALL STUDENTS';
    case 'break': {
      if (!countdown) return 'WELCOME TO ADCI';
      return `SEMESTER BREAK — ${up(countdown.label.replace(/ In$/i, ''))} ${d}`;
    }
    case 'christmas': return withDate('MERRY CHRISTMAS & HAPPY HOLIDAYS! • CAMPUS REOPENS');
    default: return 'WELCOME TO ADCI';
  }
}

export function bannerFor(state) {
  const override = state.period && state.period.banner;
  let text = override ? up(override) : baseText(state);
  for (const ev of state.events || []) text += ' • TODAY: ' + up(ev.banner || ev.name);
  return text;
}

const INFO = { header: 'ADCI | Information Hub', hub: "TODAY'S SCHEDULE", card: null };
const TITLES = {
  teaching: INFO,
  orientation: INFO,
  summer: INFO,
  assessment: { ...INFO, card: 'ASSESSMENT WEEK' },
  tuition: { header: 'ADCI | Tuition-Free Week Hub', hub: 'CAMPUS LIFE', card: 'TUITION-FREE WEEK' },
  study: { header: 'ADCI | Study Break Hub', hub: 'STUDY BREAK HUB', card: 'STUDY BREAK' },
  exam: { header: 'ADCI | Exam Week Hub', hub: 'EXAM WEEK', card: 'EXAM WEEK' },
  break: { header: 'ADCI | Semester Break Hub', hub: 'SEMESTER BREAK HUB', card: 'SEMESTER BREAK' },
  christmas: { header: 'ADCI | Information Hub', hub: 'HOLIDAY BREAK', card: 'HOLIDAY BREAK' },
};

export function titlesFor(mode) {
  return { ...(TITLES[mode] || INFO) };
}
