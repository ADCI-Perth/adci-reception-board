import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { loadData } from '../assets/js/board/data.js';
import { emptyBoard } from '../assets/js/core/boarddata.js';

const book = sheets => {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};
const files = {
  'data/Calendar.xlsx': () => book({ Calendar: [{ Type: 'Teaching', Name: 'W1', Start: '03/08/2026', End: '07/08/2026', Term: 'T', 'Banner text': '' }] }),
  'data/Timetable.xlsx': () => book({ Timetable: [{ Term: 'T', Unit: 'U1', 'Unit name': 'Unit', Lecturer: 'L', Day: 'Mon', Start: '09:00', End: '10:00', Room: 'R', From: '', To: '' }] }),
};

async function withStubs(served, fn) {
  const store = new Map();
  const saved = { fetch: globalThis.fetch, ls: globalThis.localStorage };
  globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
  globalThis.fetch = async url => {
    const make = served[url];
    return make ? { ok: true, arrayBuffer: async () => make() } : { ok: false, status: 404 };
  };
  try { await fn(store, served); } finally {
    globalThis.fetch = saved.fetch;
    if (saved.ls === undefined) delete globalThis.localStorage; else globalThis.localStorage = saved.ls;
  }
}

test('Board.xlsx 404 gives emptyBoard and cal/tt still load', async () => {
  await withStubs({ ...files }, async () => {
    const d = await loadData(XLSX);
    assert.deepEqual(d.board, emptyBoard());
    assert.equal(d.cal.periods.length, 1);
    assert.equal(d.tt.classes.length, 1);
    assert.equal(d.source, 'live');
  });
});

test('missing sheet is null, present sheets load, cache written', async () => {
  const board = () => book({ Rooms: [{ Room: 'Room 1' }] });
  await withStubs({ ...files, 'data/Board.xlsx': board }, async store => {
    const d = await loadData(XLSX);
    assert.deepEqual(d.board.rooms, ['Room 1']);
    assert.ok(store.has('adci.boardRows'));
  });
});

test('cached board used when live fetch fails', async () => {
  const board = () => book({ Rooms: [{ Room: 'Room 1' }] });
  await withStubs({ ...files, 'data/Board.xlsx': board }, async (store, served) => {
    await loadData(XLSX);
    delete served['data/Board.xlsx'];
    const d = await loadData(XLSX);
    assert.deepEqual(d.board.rooms, ['Room 1']);
    assert.equal(d.source, 'live');
  });
});
