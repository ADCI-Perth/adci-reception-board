import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildManifest } from '../tools/build-media-manifest.mjs';

test('buildManifest lists supported media sorted, skipping dotfiles and other types', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-'));
    fs.mkdirSync(path.join(root, 'media/photos'), { recursive: true });
    fs.mkdirSync(path.join(root, 'media/videos'), { recursive: true });
    const b = Buffer.from('hello world');
    fs.writeFileSync(path.join(root, 'media/photos/B.jpg'), 'x');
    fs.writeFileSync(path.join(root, 'media/photos/a b.PNG'), b);
    fs.writeFileSync(path.join(root, 'media/photos/.DS_Store'), 'x');
    fs.writeFileSync(path.join(root, 'media/photos/notes.txt'), 'x');
    fs.writeFileSync(path.join(root, 'media/videos/v.mp4'), 'x');

    const m = buildManifest(root);
    assert.deepEqual(m.photos.map(p => p.file), ['a b.PNG', 'B.jpg']);
    assert.equal(m.photos[0].path, 'media/photos/a b.PNG');
    assert.equal(m.photos[0].size, b.length);
    assert.equal(m.videos.length, 1);
    assert.deepEqual(m.christmas, []);
    assert.equal(typeof m.generated, 'string');
});
