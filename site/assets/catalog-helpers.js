export function buttonLabel(channel) {
  return `View on ${channel} →`;
}

export function coverOf(product) {
  return product.media && product.media.length ? product.media[0] : null;
}

export function withAllPicks(categories) {
  const seen = new Set();
  const out = ['All Picks'];
  for (const c of categories) { if (c && !seen.has(c)) { seen.add(c); out.push(c); } }
  return out;
}

export function filterProducts(products, { category = 'All Picks', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return products.filter(p => {
    const catOk = category === 'All Picks' || p.category === category;
    const qOk = q === '' || (p.name || '').toLowerCase().includes(q);
    return catOk && qOk;
  });
}

export function nextIndex(i, len) { return len ? (i + 1) % len : 0; }
export function prevIndex(i, len) { return len ? (i - 1 + len) % len : 0; }
