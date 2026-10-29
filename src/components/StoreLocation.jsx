import { useState } from 'react';
import { MapPin, Navigation, Copy, Check, Map as MapIcon, ExternalLink, X } from 'lucide-react';
import { buildAddressText, mapsDirectionsUrl, mapsEmbedUrl } from '../utils/maps';
import { copyToClipboard } from '../utils/helpers';

const StoreLocation = ({ store }) => {
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);

  const loc = store?.location || {};
  const place = [loc.city, loc.state].filter(Boolean).join(', ');
  const hasShop = Boolean(store?.hasPhysicalStore) && Boolean(loc.address);

  // Online-only vendors (or no address saved): just show where they are based, if known
  if (!hasShop) {
    if (!place) return null;
    return (
      <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-4 py-3">
        <MapPin className="w-4 h-4 text-[#128C7E] flex-shrink-0" />
        <span>Based in <strong className="text-gray-900">{place}</strong></span>
        <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Online store</span>
      </div>
    );
  }

  const fullAddress = buildAddressText(loc);

  const handleCopy = async () => {
    const ok = await copyToClipboard(fullAddress);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-6" aria-label="Shop location">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-50 text-[#128C7E] p-2.5 rounded-xl flex-shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Visit our shop</h2>
          <p className="text-sm text-gray-600 mt-0.5 break-words">{fullAddress}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <a
          href={mapsDirectionsUrl(fullAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-4 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Navigation className="w-4 h-4 mr-2" /> Get directions
        </a>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          aria-expanded={showMap}
          className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors"
        >
          {showMap ? <><X className="w-4 h-4 mr-2" /> Hide map</> : <><MapIcon className="w-4 h-4 mr-2" /> Show map</>}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors"
        >
          {copied ? <><Check className="w-4 h-4 mr-2 text-emerald-600" /> Copied</> : <><Copy className="w-4 h-4 mr-2" /> Copy address</>}
        </button>
        {store.mapLink && (
          <a
            href={store.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Open map link
          </a>
        )}
      </div>

      {/* The map only loads when tapped, so it doesn't slow down the store or use visitors' data */}
      {showMap && (
        <div className="mt-4">
          <iframe
            title={`Map showing ${fullAddress}`}
            src={mapsEmbedUrl(fullAddress)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="w-full h-60 sm:h-80 rounded-xl border border-gray-200"
          />
          <p className="text-xs text-gray-400 mt-1.5">The pin is placed from the address above and may be approximate.</p>
        </div>
      )}
    </section>
  );
};

export default StoreLocation;
