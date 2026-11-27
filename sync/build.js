// sync/build.js
import { readdir, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parseProducts } from './src/parseProducts.js';
import { matchMedia } from './src/matchMedia.js';
import { buildCatalog } from './src/buildCatalog.js';
import { fetchSheetRows, listDriveFolder, downloadDriveFile } from './src/google.js';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing env ${name}`); process.exit(1); }
  return v;
}
const exists = (p) => access(p).then(() => true).catch(() => false);

async function main() {
  const apiKey = requireEnv('GOOGLE_API_KEY');
  const sheetId = requireEnv('SHEET_ID');
  const folderId = requireEnv('DRIVE_FOLDER_ID');
  const siteDir = process.env.SITE_DIR || 'site';
  const tab = process.env.SHEET_TAB || 'Products';
  const mediaDir = join(siteDir, 'media');

  const rows = await fetchSheetRows({ sheetId, tab, apiKey });
  const parsed = parseProducts(rows);
  const files = await listDriveFolder({ folderId, apiKey });
  const withMedia = matchMedia(parsed.products, files);

  // Download referenced media that is missing locally.
  await mkdir(mediaDir, { recursive: true });
  const referenced = new Set();
  let downloaded = 0;
  for (const p of withMedia) {
    for (const m of p.media) {
      referenced.add(m.fileName);
      const dest = join(mediaDir, m.fileName);
      if (!(await exists(dest))) { await downloadDriveFile({ fileId: m.fileId, apiKey, destPath: dest }); downloaded++; }
    }
  }
  // Remove local media no longer referenced (keep .gitkeep).
  let removed = 0;
  for (const name of await readdir(mediaDir)) {
    if (name === '.gitkeep') continue;
    if (!referenced.has(name)) { await rm(join(mediaDir, name)); removed++; }
  }

  const catalog = buildCatalog({ products: withMedia, categories: parsed.categories }, new Date().toISOString());
  await writeFile(join(siteDir, 'products.json'), JSON.stringify(catalog, null, 2));

  console.log(`published=${catalog.products.length} skipped=${parsed.skipped.length} media_downloaded=${downloaded} media_removed=${removed}`);
  for (const s of parsed.skipped) console.log(`  skip row ${s.row}: ${s.reason}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
