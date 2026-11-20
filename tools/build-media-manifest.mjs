// Scans media/photos, media/videos and media/christmas and writes media/manifest.json.
// Run by the GitHub Actions deploy: node tools/build-media-manifest.mjs [root]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXT = ['.mp4', '.webm'];

function scan(rootDir, folder, exts) {
    const dir = path.join(rootDir, folder);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isFile() && !e.name.startsWith('.') && exts.includes(path.extname(e.name).toLowerCase()))
        .map(e => ({
            file: e.name,
            path: `${folder}/${e.name}`,
            size: fs.statSync(path.join(dir, e.name)).size
        }))
        .sort((a, b) => a.file.localeCompare(b.file, 'en', { sensitivity: 'base' }));
}

export function buildManifest(rootDir) {
    return {
        generated: new Date().toISOString(),
        photos: scan(rootDir, 'media/photos', IMAGE_EXT),
        videos: scan(rootDir, 'media/videos', VIDEO_EXT),
        christmas: scan(rootDir, 'media/christmas', IMAGE_EXT)
    };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const root = path.resolve(process.argv[2] || '.');
    const manifest = buildManifest(root);
    fs.mkdirSync(path.join(root, 'media'), { recursive: true });
    fs.writeFileSync(path.join(root, 'media/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`manifest: ${manifest.photos.length} photos, ${manifest.videos.length} videos, ${manifest.christmas.length} christmas`);
}
