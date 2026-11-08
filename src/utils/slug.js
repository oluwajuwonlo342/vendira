const FILLER = new Set([
  'and', 'the', 'of', 'for', 'a', 'an', 'store', 'stores', 'shop', 'shops',
  'ltd', 'limited', 'enterprises', 'enterprise', 'nig', 'nigeria',
]);

export const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Cut at a word boundary where possible
const clip = (slug, max) => {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash >= 6 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
};

export const suggestSlugs = (name) => {
  const full = slugify(name || '');
  if (!full) return [];
  const words = full.split('-');
  const core = words.filter((w) => !FILLER.has(w));
  const short = clip((core.length ? core : words).join('-'), 20);
  const suffix = String(Math.floor(10 + Math.random() * 90));
  return [...new Set([short, clip(full, 30), `${short}-${suffix}`])].filter(Boolean);
};