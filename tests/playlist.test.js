import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlaylist, mediaPath } from '../assets/js/core/playlist.js';

const item = (dir, n) => ({ file: n, path: `media/${dir}/${n}`, size: 1 });
const manifest = {
  generated: 'x',
  photos: [1, 2, 3, 4, 5, 6, 7].map((i) => item('photos', `p${i}`)),
  videos: [item('videos', 'v1'), item('videos', 'v2')],
  christmas: [item('christmas', 'c1')],
};
const kinds = (s) => s.map((x) => x.kind);

test('interleave pattern', () => {
  assert.deepEqual(kinds(buildPlaylist({ manifest, courses: [], captions: {}, mode: 'teaching' })),
    ['map', 'photo', 'photo', 'photo', 'video', 'photo', 'photo', 'photo', 'video', 'photo']);
});
test('christmas first', () => {
  const s = buildPlaylist({ manifest, courses: [], captions: {}, mode: 'christmas' });
  assert.equal(s[1].url, 'media/christmas/c1');
  assert.equal(buildPlaylist({ manifest, courses: [], captions: {}, mode: 'teaching' }).some((x) => x.url === 'media/christmas/c1'), false);
});
test('courses after map', () => {
  const s = buildPlaylist({ manifest, courses: [{ course: 'X', photo: 'p1' }, { course: 'Y', photo: 'nope' }], captions: {}, mode: 'teaching' });
  assert.equal(s[1].kind, 'course');
  assert.equal(s[1].photoUrl, 'media/photos/p1');
  assert.equal(s[2].kind, 'course');
  assert.equal(s[2].photoUrl, null);
  assert.equal(s[3].kind, 'photo');
});
test('invalid manifest', () => {
  assert.deepEqual(buildPlaylist({ manifest: null }), [{ kind: 'map' }]);
  assert.deepEqual(buildPlaylist({ manifest: { photos: 1, videos: [] } }), [{ kind: 'map' }]);
});
test('no photos: map, courses, videos', () => {
  const m = { photos: [], videos: [item('videos', 'v1')] };
  assert.deepEqual(kinds(buildPlaylist({ manifest: m, courses: [{ course: 'X', photo: '' }], captions: {}, mode: 'teaching' })), ['map', 'course', 'video']);
});
test('mediaPath encodes segments', () => {
  assert.equal(mediaPath('media/photos/a #1 & b (1).jpg'), 'media/photos/a%20%231%20%26%20b%20(1).jpg');
});
test('captions by file name', () => {
  const s = buildPlaylist({ manifest, courses: [], captions: { p1: 'Hello' }, mode: 'teaching' });
  assert.equal(s[1].caption, 'Hello');
  assert.equal(s[2].caption, null);
});
