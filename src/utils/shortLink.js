export const SHORT_MIN = 3;
export const SHORT_MAX = 24;

const FORMAT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const cleanShortCode = (raw) => String(raw ?? '').trim().toLowerCase().replace(/^[@/]+/, '');

// Returns a message when the name is badly formed, or '' when it looks fine
export const validateShortCodeFormat = (code) => {
  if (code.length < SHORT_MIN || code.length > SHORT_MAX) return `Use ${SHORT_MIN} to ${SHORT_MAX} characters.`;
  if (!FORMAT_RE.test(code)) return 'Use only letters, numbers and single hyphens, with no spaces.';
  return '';
};

// "https://vendira.com/gadgets" -> "vendira.com/gadgets". Bios link it automatically without the https://.
export const stripProtocol = (url) => String(url || '').replace(/^https?:\/\//i, '');

// Short-name ideas built from the store name, for example "My Gadget Hub" -> mygadgethub, my, mgh
export const suggestShortCodes = (name, exclude = '') => {
  const words = String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);

  const ideas = new Set();
  const joined = words.join('');
  if (joined.length >= SHORT_MIN) ideas.add(joined.slice(0, 20));
  if (words[0] && words[0].length >= SHORT_MIN) ideas.add(words[0].slice(0, 20));
  if (words.length >= SHORT_MIN) ideas.add(words.map((w) => w[0]).join(''));

  return [...ideas].filter((c) => c !== exclude && !validateShortCodeFormat(c)).slice(0, 3);
};