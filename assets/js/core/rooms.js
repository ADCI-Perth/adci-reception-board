// Times are HH:MM strings; they compare correctly as strings.
export function roomsNow(classesToday, extraRooms, nowHHMM) {
  const classes = classesToday || [];
  const hadClasses = new Set();
  const rooms = [];
  for (const c of classes) {
    const room = typeof c.room === 'string' ? c.room.trim() : '';
    if (!room) continue;
    hadClasses.add(room);
    if (!rooms.includes(room)) rooms.push(room);
  }
  for (const r of extraRooms || []) {
    const room = typeof r === 'string' ? r.trim() : '';
    if (room && !rooms.includes(room)) rooms.push(room);
  }
  return rooms.map((room) => {
    const mine = classes.filter((c) => (c.room || '').trim() === room);
    const busy = mine.find((c) => c.start <= nowHHMM && nowHHMM < c.end);
    if (busy) return { room, status: 'busy', text: `${busy.unit} · until ${busy.end}` };
    const later = mine.filter((c) => c.start > nowHHMM).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    if (later.length) return { room, status: 'next', text: `${later[0].unit} from ${later[0].start}` };
    return { room, status: 'free', text: hadClasses.has(room) ? 'No more classes today' : 'Free' };
  });
}
