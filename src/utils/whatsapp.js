import { formatMoney } from './money';

export const WHATSAPP_HELP =
  'Enter a valid WhatsApp number, for example 08012345678. For numbers outside Nigeria, start with + and the country code, for example +233201234567.';

// Same rules as the server, so what vendors see while typing matches what is saved
export const normalizeWhatsapp = (raw) => {
  const text = String(raw ?? '').trim();
  let digits = text.replace(/\D/g, '');
  if (!digits) return null;

  if (!text.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = `234${digits.slice(1)}`;
    else if (digits.length === 10 && /^[789]/.test(digits)) digits = `234${digits}`;
  }
  if (digits.startsWith('2340') && digits.length === 14) digits = `234${digits.slice(4)}`;

  if (digits.length < 8 || digits.length > 15 || digits.startsWith('0')) return null;
  if (digits.startsWith('234') && digits.length !== 13) return null;
  return digits;
};

export const buildWhatsAppMessage = ({ productName, price, currency, link, variations = {}, mode = 'order' }) => {
  const verb = mode === 'enquire' ? 'enquire about' : 'order';
  const name = String(productName || 'this product').slice(0, 120);
  const parts = [
    `Hello, I found this product on Vendira and would like to ${verb} ${name} priced at ${formatMoney(price, currency)}.`,
  ];

  const chosen = Object.entries(variations).filter(([, value]) => value);
  if (chosen.length) parts.push(`Selected: ${chosen.map(([key, value]) => `${key}: ${value}`).join(', ')}.`);

  parts.push(`Product link: ${link}`);
  parts.push('Is it available?');
  return parts.join('\n\n');
};

// wa.me works on phones (opens the app) and on desktop (opens WhatsApp Desktop or WhatsApp Web)
export const buildWhatsAppUrl = (digits, message) => `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
