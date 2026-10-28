import { MessageCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { normalizeWhatsapp, buildWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';

const TRACK_COOLDOWN_MS = 30000;
const lastTracked = new Map();

// Counts a tap on the button. Repeat taps within 30 seconds don't count again.
// sendBeacon survives the browser switching to the WhatsApp app; axios is the fallback.
export const trackWhatsAppClick = (productId) => {
  const now = Date.now();
  if (now - (lastTracked.get(productId) || 0) < TRACK_COOLDOWN_MS) return;
  lastTracked.set(productId, now);

  try {
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (navigator.sendBeacon && navigator.sendBeacon(`${base}/products/${productId}/click`)) return;
  } catch {
    // fall through to the normal request
  }
  api.post(`/products/${productId}/click`).catch(() => {});
};

const WhatsAppButton = ({ store, product, variations, productLink }) => {
  const digits = store?.whatsappDigits ?? normalizeWhatsapp(store?.whatsappNumber);
  const mode = store?.whatsappCta === 'enquire' ? 'enquire' : 'order';
  const label = mode === 'enquire' ? 'Enquire on WhatsApp' : 'Order on WhatsApp';

  // The vendor hasn't set up a usable number: explain instead of sending customers to a dead link
  if (!digits) {
    return (
      <div role="status" className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">WhatsApp is not set up for this store yet</p>
          <p className="text-xs text-amber-800 mt-0.5">The seller hasn't added a working WhatsApp number. Please check back soon.</p>
        </div>
      </div>
    );
  }

  const message = buildWhatsAppMessage({
    productName: product.name,
    price: product.price,
    currency: store?.currency || 'NGN',
    link: productLink,
    variations,
    mode,
  });

  return (
    <div>
      <a
        href={buildWhatsAppUrl(digits, message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick(product._id)}
        className="w-full flex items-center justify-center py-3.5 sm:py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-sm text-base sm:text-lg transition-colors"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> {label}
      </a>
      <p className="text-[11px] text-gray-500 text-center mt-1.5">
        Opens WhatsApp with your message ready to send. Nothing is ordered or paid until you agree details with the seller.
      </p>
    </div>
  );
};

export default WhatsAppButton;
