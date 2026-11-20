export function mediaPath(path) {
  return String(path).split('/').map(encodeURIComponent).join('/');
}

const PHOTOS_PER_VIDEO = 3;

export function buildPlaylist({ manifest, courses, captions, mode } = {}) {
  const map = { kind: 'map' };
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.photos) || !Array.isArray(manifest.videos)) {
    return [map];
  }
  const caps = captions || {};
  const christmas = Array.isArray(manifest.christmas) ? manifest.christmas : [];
  const photoItems = mode === 'christmas' ? [...christmas, ...manifest.photos] : manifest.photos;
  const photoPaths = new Set(manifest.photos.map((p) => p.path));

  const slides = [map];
  for (const c of courses || []) {
    const path = c.photo ? `media/photos/${c.photo}` : null;
    slides.push({ kind: 'course', course: c, photoUrl: path && photoPaths.has(path) ? mediaPath(path) : null });
  }

  const videos = manifest.videos.map((v) => ({ kind: 'video', url: mediaPath(v.path) }));
  let v = 0;
  photoItems.forEach((item, i) => {
    slides.push({ kind: 'photo', url: mediaPath(item.path), caption: caps[item.file] || null });
    if ((i + 1) % PHOTOS_PER_VIDEO === 0 && v < videos.length) slides.push(videos[v++]);
  });
  while (v < videos.length) slides.push(videos[v++]);
  return slides;
}
