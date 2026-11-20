const NO_QR = ['break', 'christmas'];
const SCHEDULE = ['teaching', 'orientation', 'summer', 'assessment'];

export const showsQR = (mode) => !NO_QR.includes(mode);
export const showsRooms = (mode) => SCHEDULE.includes(mode);
export const hubKind = (mode) => (SCHEDULE.includes(mode) ? 'classes' : 'info');

export function chipText(state) {
  const { mode, period } = state || {};
  if (mode === 'break') return 'SEMESTER BREAK';
  if (mode === 'christmas') return 'CHRISTMAS CLOSURE';
  if (!period || !period.name) return 'WELCOME';
  return String(period.name).toUpperCase();
}
