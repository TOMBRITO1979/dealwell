const HIDDEN = new Set(['no','false','0','hide']);
const cell = (row, i) => (row[i] == null ? '' : String(row[i]).trim());

export function parseProducts(rows) {
  const products = [];
  const categories = [];
  const seenCat = new Set();
  const seenId = new Set();
  const skipped = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const idRaw = cell(row, 0);
    const name = cell(row, 1);
    const category = cell(row, 2);
    const description = cell(row, 3);
    const channel = cell(row, 4);
    const link = cell(row, 5);
    const show = cell(row, 6).toLowerCase();

    if (!idRaw && !name && !channel && !link) continue; // blank row

    if (HIDDEN.has(show)) continue;                      // hidden, not an error
    if (!name)    { skipped.push({ row: r+1, reason: 'missing Name' }); continue; }
    if (!channel) { skipped.push({ row: r+1, reason: 'missing Channel' }); continue; }
    if (!link)    { skipped.push({ row: r+1, reason: 'missing Link' }); continue; }

    const id = Number.parseInt(idRaw, 10);
    if (!Number.isFinite(id)) { skipped.push({ row: r+1, reason: `invalid # "${idRaw}"` }); continue; }
    if (seenId.has(id)) { skipped.push({ row: r+1, reason: `duplicate # ${id}` }); continue; }
    seenId.add(id);

    if (category && !seenCat.has(category)) { seenCat.add(category); categories.push(category); }
    products.push({ id, name, category, description, channel, link });
  }
  return { products, categories, skipped };
}
