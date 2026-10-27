import { Store as StoreIcon, MapPin, Tag, ShoppingBag, MessageCircle } from 'lucide-react';

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', twitter: 'X', website: 'Website' };
const formatPrice = (price) => `₦${Number(price || 0).toLocaleString()}`;

// Shows the storefront the way customers will see it
const StorePreview = ({ store, products = [] }) => {
  const name = store?.businessName || store?.name || 'Your store name';
  const place = [store?.location?.city, store?.location?.state].filter(Boolean).join(', ');
  const social = Object.entries(store?.socialLinks || {}).filter(([, v]) => v);
  const cover = store?.coverImage?.url;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-[#F8FAFC] shadow-sm">
      <div
        className={`h-28 sm:h-40 relative ${cover ? '' : 'bg-gradient-to-r from-[#128C7E] to-[#25D366]'}`}
        style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="px-3 sm:px-6 -mt-10 relative">
        <div className="bg-white rounded-2xl shadow p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left border border-gray-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
            {store?.logo?.url ? <img src={store.logo.url} alt="" className="w-full h-full object-cover" /> : <StoreIcon className="w-8 h-8 text-gray-300" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 break-words">{name}</h3>
            {(store?.businessType || place) && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-1.5">
                {store?.businessType && (
                  <span className="inline-flex items-center text-[11px] font-semibold bg-emerald-50 text-[#128C7E] px-2 py-1 rounded-full">
                    <Tag className="w-3 h-3 mr-1" /> {store.businessType}
                  </span>
                )}
                {place && (
                  <span className="inline-flex items-center text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3 mr-1" /> {place}
                  </span>
                )}
              </div>
            )}
            {store?.description ? (
              <p className="text-sm text-gray-600 mt-2 break-words">{store.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic mt-2">Your store description will appear here.</p>
            )}
            {social.length > 0 && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-3">
                {social.map(([key]) => (
                  <span key={key} className="text-[11px] font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full">{SOCIAL_LABELS[key]}</span>
                ))}
              </div>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <div className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl">
              <MessageCircle className="w-4 h-4 mr-2 text-[#25D366]" /> Contact Seller
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
          <ShoppingBag className="w-4 h-4 mr-1.5 text-[#128C7E]" /> Available Products
        </h4>
        {products.length === 0 ? (
          <p className="text-sm text-gray-400 italic bg-white border border-dashed border-gray-200 rounded-xl p-4 text-center">
            No products yet. Add one to see it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.slice(0, 3).map((p) => (
              <div key={p._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                  {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-8 h-8 text-gray-300" />}
                </div>
                <div className="p-2.5">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-sm font-black text-[#128C7E]">{formatPrice(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePreview;
