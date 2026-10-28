import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle, ShoppingBag, Store as StoreIcon, Search, X, ChevronRight, Star, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { formatMoney } from '../utils/money';
import { normalizeWhatsapp, buildWhatsAppUrl } from '../utils/whatsapp';
import WhatsAppButton from '../components/WhatsAppButton';

const getOptions = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (value === null || value === undefined) return [];
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
};

const getCategoryName = (cat) => {
  if (!cat) return 'Uncategorized';
  return typeof cat === 'object' ? (cat.name || 'Uncategorized') : 'Uncategorized';
};

const averageRating = (reviews = []) =>
  reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

const recordViewOnce = (productId) => {
  const key = `vendira_viewed_${productId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // sessionStorage unavailable: record anyway
  }
  api.post(`/products/${productId}/view`).catch(() => {});
};

const Storefront = () => {
  const { storeSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [activeImage, setActiveImage] = useState(0);
  const [linkNotice, setLinkNotice] = useState('');
  const handledLink = useRef(null);

  const [feedbackData, setFeedbackData] = useState({ customerName: '', rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const currency = store?.currency || 'NGN';
  const money = (amount) => formatMoney(amount, currency);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        const storeRes = await api.get(`/stores/slug/${storeSlug}`);
        const storeData = storeRes.data.data.store;
        setStore(storeData);

        const productsRes = await api.get(`/products/store/${storeData._id}`);
        setProducts(productsRes.data.data.products || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Store not found or is currently unavailable.');
      } finally {
        setLoading(false);
      }
    };

    if (storeSlug) fetchStorefrontData();
  }, [storeSlug]);

  const productLink = (product) => `${window.location.origin}/store/${store?.slug || storeSlug}?product=${product._id}`;

  const handleOpenProduct = (product, { updateUrl = true } = {}) => {
    handledLink.current = product._id;
    setSelectedProduct(product);
    setActiveImage(0);
    setFeedbackMsg({ type: '', text: '' });
    setFeedbackData({ customerName: '', rating: 5, comment: '' });

    const defaults = {};
    (product.attributes || []).forEach((attr) => {
      const options = getOptions(attr.value);
      if (options.length > 0) defaults[attr.name] = options[0];
    });
    setSelectedVariations(defaults);

    if (updateUrl) setSearchParams({ product: product._id }, { replace: true });
    recordViewOnce(product._id);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedVariations({});
    setSearchParams({}, { replace: true });
  };

  // A shared product link (?product=ID) opens that product as soon as the store has loaded
  useEffect(() => {
    const wanted = searchParams.get('product');
    if (loading || !store || !wanted || handledLink.current === wanted) return;
    handledLink.current = wanted;

    const match = products.find((p) => p._id === wanted);
    if (match) {
      handleOpenProduct(match, { updateUrl: false });
    } else {
      setLinkNotice("That product isn't available any more, but you can browse the rest of this store.");
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, store, products, searchParams]);

  // Modal: Escape closes it and the page behind stops scrolling
  useEffect(() => {
    if (!selectedProduct) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') handleCloseModal(); };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const updateVariation = (name, value) => {
    setSelectedVariations((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const res = await api.post(`/products/${selectedProduct._id}/feedback`, {
        ...feedbackData,
        rating: Number(feedbackData.rating),
      });

      const newReview = res.data.data.review;
      const updatedProduct = {
        ...selectedProduct,
        reviews: [...(selectedProduct.reviews || []), newReview],
      };
      setSelectedProduct(updatedProduct);
      setProducts((prev) => prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)));

      setFeedbackMsg({ type: 'success', text: 'Thank you for your feedback!' });
      setFeedbackData({ customerName: '', rating: 5, comment: '' });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, index) => (
      <Star key={index} className={`w-4 h-4 ${index < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));

  const categories = useMemo(() => {
    const cats = products.map((p) => getCategoryName(p.category));
    return ['All', ...new Set(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catName = getCategoryName(p.category);
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || catName.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center text-center px-4">
        <StoreIcon className="w-12 h-12 text-gray-300 mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Store not found</h1>
        <p className="text-gray-500 mt-1">{error || 'This store is unavailable.'}</p>
      </div>
    );
  }

  const modalImages = selectedProduct?.images || [];
  const modalReviews = selectedProduct?.reviews || [];
  const modalAverage = averageRating(modalReviews);

  const storeName = store.name || store.businessName;
  const sellerDigits = store.whatsappDigits ?? normalizeWhatsapp(store.whatsappNumber);
  const contactUrl = sellerDigits
    ? buildWhatsAppUrl(
        sellerDigits,
        `Hello, I found your store (${storeName}) on Vendira and would like to ask a question.\n\nStore link: ${window.location.origin}/store/${store.slug}`
      )
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16 sm:pb-20 relative overflow-x-hidden">

      {/* STORE HEADER */}
      <div className="bg-white pb-6 sm:pb-8 shadow-sm">
        <div
          className={`h-36 sm:h-56 w-full relative overflow-hidden ${!store.coverImage?.url ? 'bg-gradient-to-r from-[#128C7E] to-[#25D366]' : ''}`}
          style={store.coverImage?.url ? { backgroundImage: `url(${store.coverImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-14 sm:-mt-24">
          <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 border border-gray-100">
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl bg-gray-50 border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden z-10">
              {store.logo?.url ? <img src={store.logo.url} alt={storeName} className="w-full h-full object-cover" /> : <StoreIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0 sm:mt-4 z-10">
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 break-words">{storeName}</h1>
              {store.description && (
                <p className="text-gray-600 mt-2 text-sm sm:text-base leading-relaxed max-w-2xl break-words">{store.description}</p>
              )}
            </div>
            <div className="sm:mt-6 sm:ml-auto w-full sm:w-auto z-10">
              {contactUrl ? (
                <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-sm transition-colors">
                  <MessageCircle className="w-5 h-5 mr-2 text-[#25D366]" /> Contact Seller
                </a>
              ) : (
                <p className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3">WhatsApp not available for this store yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT CATALOGUE */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">

        {linkNotice && (
          <div role="status" className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 flex-1">{linkNotice}</p>
            <button onClick={() => setLinkNotice('')} aria-label="Dismiss" className="text-amber-700 hover:text-amber-900"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-3 sm:gap-4">
          <div className="flex items-center flex-wrap gap-y-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#128C7E] mr-2" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Available Products</h2>
            <span className="ml-3 bg-emerald-100 text-[#128C7E] text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{filteredProducts.length} Items</span>
          </div>
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25D366] text-base sm:text-sm"
            />
          </div>
        </div>

        {categories.length > 2 && (
          <div className="flex overflow-x-auto pb-3 mb-3 gap-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap flex-shrink-0 px-4 sm:px-5 py-2 rounded-full text-sm font-bold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-[#128C7E] border-[#128C7E] text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#128C7E] hover:text-[#128C7E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 sm:py-12 px-4 bg-white rounded-2xl border border-gray-100 mt-4">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">{products.length === 0 ? 'No products yet' : 'No products found'}</h3>
            <p className="text-gray-500 text-sm sm:text-base">
              {products.length === 0 ? 'This store is still adding its products. Please check back soon.' : 'Try adjusting your search or selecting a different category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((p) => (
              <div key={p._id} onClick={() => handleOpenProduct(p)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100 flex flex-col cursor-pointer min-w-0">
                <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center">
                  {p.images?.length > 0 ? <img src={p.images[0].url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />}
                  {p.status === 'limited' && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Limited stock</span>
                  )}
                </div>
                <div className="p-3 sm:p-5 flex flex-col flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight mb-1 truncate">{p.name}</h3>

                  {p.reviews?.length > 0 && (
                    <div className="flex items-center mb-2">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="text-xs text-gray-500 font-medium">
                        {averageRating(p.reviews).toFixed(1)} ({p.reviews.length})
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-gray-50">
                    <p className="text-base sm:text-lg font-black text-[#128C7E] truncate">{money(p.price)}</p>
                    <div className="hidden sm:block bg-gray-50 p-1.5 rounded-lg text-gray-400 group-hover:bg-[#25D366] group-hover:text-white transition-colors flex-shrink-0"><ChevronRight className="w-4 h-4" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRODUCT MODAL: bottom sheet on phones, centered two-column dialog from md up */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={selectedProduct.name}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>

          <div className="relative bg-white w-full sm:max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col">
            <button onClick={handleCloseModal} aria-label="Close" className="absolute top-3 right-3 z-20 bg-white/90 text-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden rounded-t-3xl sm:rounded-3xl">

              {/* Gallery */}
              <div className="w-full md:w-1/2 bg-gray-50 flex flex-col flex-shrink-0 md:overflow-hidden">
                <div className="h-64 sm:h-80 md:h-auto md:flex-1 md:min-h-[24rem] flex items-center justify-center overflow-hidden">
                  {modalImages.length > 0
                    ? <img src={modalImages[activeImage]?.url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    : <ShoppingBag className="w-20 h-20 text-gray-300" />}
                </div>
                {modalImages.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-gray-100">
                    {modalImages.map((img, i) => (
                      <button
                        key={img.public_id || i}
                        onClick={() => setActiveImage(i)}
                        aria-label={`Show photo ${i + 1}`}
                        className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 ${i === activeImage ? 'border-[#128C7E]' : 'border-transparent'}`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="w-full md:w-1/2 p-5 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:overflow-y-auto flex flex-col bg-white min-w-0">
                <span className="text-xs font-bold text-[#128C7E] uppercase tracking-wider mb-2 block">
                  {getCategoryName(selectedProduct.category)}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-2 break-words">{selectedProduct.name}</h2>

                {modalReviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{renderStars(modalAverage)}</div>
                    <span className="text-sm text-gray-500">{modalAverage.toFixed(1)} ({modalReviews.length})</span>
                  </div>
                )}

                <p className="text-2xl sm:text-3xl font-black text-[#128C7E] mb-5 sm:mb-6">{money(selectedProduct.price)}</p>

                {selectedProduct.description && (
                  <div className="mb-5 sm:mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line break-words">{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.attributes?.length > 0 && (
                  <div className="space-y-4 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-gray-100">
                    {selectedProduct.attributes.map((attr, idx) => {
                      const options = getOptions(attr.value);
                      if (options.length === 0) return null;
                      return (
                        <div key={idx}>
                          <h4 className="text-sm font-bold text-gray-900 mb-2">{attr.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt, i) => (
                              <button key={i} onClick={() => updateVariation(attr.name, opt)} className={`px-4 py-2.5 sm:py-2 text-sm font-semibold rounded-xl border transition-all ${selectedVariations[attr.name] === opt ? 'bg-[#128C7E] border-[#128C7E] text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-[#128C7E]'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* On phones this bar stays pinned to the bottom of the sheet so the button is always in reach */}
                <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-6px_12px_-8px_rgba(0,0,0,0.15)] mb-5 md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-0 md:shadow-none md:bg-transparent md:backdrop-blur-none md:mb-8">
                  <WhatsAppButton
                    store={store}
                    product={selectedProduct}
                    variations={selectedVariations}
                    productLink={productLink(selectedProduct)}
                  />
                </div>

                {/* REVIEWS */}
                <div className="pt-5 sm:pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    Customer Reviews <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{modalReviews.length}</span>
                  </h3>

                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {modalReviews.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No reviews yet. Be the first to leave feedback!</p>
                    ) : (
                      modalReviews.map((rev, i) => (
                        <div key={rev._id || i} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-gray-800 text-sm truncate">{rev.customerName}</span>
                            <div className="flex flex-shrink-0">{renderStars(rev.rating)}</div>
                          </div>
                          <p className="text-gray-600 text-sm break-words">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                    <h4 className="font-bold text-gray-800 text-sm mb-4">Leave Feedback</h4>
                    {feedbackMsg.text && (
                      <p className={`text-sm font-semibold mb-3 ${feedbackMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {feedbackMsg.text}
                      </p>
                    )}

                    <form onSubmit={handleSubmitFeedback} className="space-y-3">
                      <input type="text" placeholder="Your Name" required maxLength={60} autoComplete="name" value={feedbackData.customerName} onChange={(e) => setFeedbackData({ ...feedbackData, customerName: e.target.value })} className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-[#25D366]" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium flex-shrink-0">Rating:</span>
                        <select value={feedbackData.rating} onChange={(e) => setFeedbackData({ ...feedbackData, rating: Number(e.target.value) })} className="flex-1 sm:flex-none min-w-0 px-2 py-2 sm:py-1 border border-gray-300 rounded-lg text-base sm:text-sm bg-white">
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                      <textarea placeholder="Write your review here..." required rows="3" maxLength={1000} value={feedbackData.comment} onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })} className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-[#25D366]" />
                      <button type="submit" disabled={submittingFeedback} className="w-full py-3 sm:py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-70">
                        {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Storefront;
