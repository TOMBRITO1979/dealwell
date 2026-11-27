const IMAGE = new Set(['jpg','jpeg','png','webp','gif']);
const VIDEO = new Set(['mp4','mov','webm']);

const ext = (name) => { const i = name.lastIndexOf('.'); return i < 0 ? '' : name.slice(i+1).toLowerCase(); };

export function mediaType(name) {
  const e = ext(name);
  if (IMAGE.has(e)) return 'image';
  if (VIDEO.has(e)) return 'video';
  return null;
}

export function productIdFromFilename(name) {
  const m = /^(\d+)[._-]/.exec(name);
  return m ? Number.parseInt(m[1], 10) : null;
}

// natural compare so 1.2 < 1.10
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function matchMedia(products, files, { mediaPath = 'media' } = {}) {
  const byId = new Map();
  for (const f of files) {
    const type = mediaType(f.name);
    const pid = productIdFromFilename(f.name);
    if (type == null || pid == null) continue;
    if (!byId.has(pid)) byId.set(pid, []);
    byId.get(pid).push({ type, fileId: f.id, fileName: f.name });
  }
  for (const list of byId.values()) list.sort((x, y) => naturalCompare(x.fileName, y.fileName));

  return products.map(p => ({
    ...p,
    media: (byId.get(p.id) || []).map(m => ({
      type: m.type, src: `${mediaPath}/${m.fileName}`, fileId: m.fileId, fileName: m.fileName,
    })),
  }));
}
