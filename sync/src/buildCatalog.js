export function buildCatalog({ products, categories }, generatedAt) {
  return {
    generated_at: generatedAt,
    categories: [...categories],
    products: products.map(p => ({
      id: p.id, name: p.name, category: p.category, description: p.description || '',
      channel: p.channel, link: p.link,
      media: (p.media || []).map(m => ({ type: m.type, src: m.src })),
    })),
  };
}
