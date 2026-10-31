import { useState, useEffect, useMemo } from 'react';
import {
  Star, MessageSquare, Package, Search, CornerDownRight, Pencil, Trash2,
  AlertCircle, CheckCircle,
} from 'lucide-react';
import api from '../../api/axios';

const MAX_REPLY = 1000;

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'needs', label: 'Needs a reply' },
  { value: 'replied', label: 'Replied' },
];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

const describeError = (error, fallback) => {
  if (error.response) {
    return error.response.data?.error || error.response.data?.message || `${fallback} (error ${error.response.status}).`;
  }
  return 'Could not reach the server. It may be waking up, so please try again in a moment.';
};

const average = (reviews) =>
  reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;

const Stars = ({ rating }) => (
  <div className="flex flex-shrink-0" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

const ReviewCard = ({ review, busy, editing, draft, onDraft, onStartReply, onCancel, onSave, onDelete, error }) => {
  const hasReply = Boolean(review.reply?.message);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm min-w-0 flex flex-col">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <span className="font-bold text-gray-900 text-sm block truncate">{review.customerName}</span>
          <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
        </div>
        <Stars rating={review.rating} />
      </div>

      <p className="text-gray-600 text-sm leading-relaxed break-words whitespace-pre-line">"{review.comment}"</p>

      {/* Your reply, as customers see it */}
      {hasReply && !editing && (
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <p className="text-xs font-bold text-[#128C7E] flex items-center">
            <CornerDownRight className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> Your reply
            {review.reply.repliedAt && <span className="ml-2 font-normal text-gray-400">{formatDate(review.reply.repliedAt)}</span>}
          </p>
          <p className="text-sm text-gray-800 mt-1.5 break-words whitespace-pre-line">{review.reply.message}</p>
          <div className="flex gap-1 mt-2 -ml-2">
            <button
              onClick={onStartReply}
              disabled={busy}
              className="flex items-center text-xs font-bold text-gray-600 hover:bg-white px-2.5 py-1.5 rounded-lg"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </button>
            <button
              onClick={onDelete}
              disabled={busy}
              className="flex items-center text-xs font-bold text-red-500 hover:bg-white px-2.5 py-1.5 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Reply box */}
      {editing && (
        <div className="mt-4">
          <label htmlFor={`reply-${review._id}`} className="block text-xs font-bold text-gray-700 mb-1">
            {hasReply ? 'Edit your reply' : `Reply to ${review.customerName}`}
          </label>
          <textarea
            id={`reply-${review._id}`}
            rows="3"
            maxLength={MAX_REPLY}
            autoFocus
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] resize-y"
            placeholder="Thank them, answer their question, or put things right. This is public."
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-gray-400">Everyone who visits your store can see this reply.</p>
            <p className="text-[11px] text-gray-400">{draft.length}/{MAX_REPLY}</p>
          </div>
          {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onSave}
              disabled={busy || !draft.trim()}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? 'Posting...' : hasReply ? 'Save reply' : 'Post reply'}
            </button>
            <button
              onClick={onCancel}
              disabled={busy}
              className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!hasReply && !editing && (
        <button
          onClick={onStartReply}
          className="mt-4 self-start flex items-center text-sm font-bold text-[#128C7E] bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
        >
          <CornerDownRight className="w-4 h-4 mr-1.5" /> Reply
        </button>
      )}
    </div>
  );
};

const Reviews = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [editingKey, setEditingKey] = useState(null); // "productId:reviewId"
  const [draft, setDraft] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [cardError, setCardError] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products');
        const all = res.data?.data?.products || [];
        setProducts(all.filter((p) => p.reviews && p.reviews.length > 0));
      } catch (error) {
        console.error('Error fetching reviews:', error.response?.status, error.response?.data);
        setLoadError(describeError(error, 'Could not load your reviews'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const keyOf = (productId, reviewId) => `${productId}:${reviewId}`;

  const patchReview = (productId, reviewId, updated) =>
    setProducts((prev) =>
      prev.map((p) =>
        p._id === productId
          ? { ...p, reviews: p.reviews.map((r) => (r._id === reviewId ? { ...r, reply: updated.reply } : r)) }
          : p
      )
    );

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice({ type: '', text: '' }), 5000);
  };

  const startReply = (product, review) => {
    setEditingKey(keyOf(product._id, review._id));
    setDraft(review.reply?.message || '');
    setCardError('');
  };

  const cancelReply = () => {
    setEditingKey(null);
    setDraft('');
    setCardError('');
  };

  const saveReply = async (product, review) => {
    const key = keyOf(product._id, review._id);
    setBusyKey(key);
    setCardError('');
    try {
      const res = await api.put(`/products/${product._id}/reviews/${review._id}/reply`, { message: draft.trim() });
      patchReview(product._id, review._id, res.data?.data?.review || { reply: { message: draft.trim(), repliedAt: new Date() } });
      cancelReply();
      showNotice('success', 'Your reply is now visible on your store.');
    } catch (error) {
      console.error('Save reply failed:', error.response?.status, error.response?.data);
      setCardError(describeError(error, 'Could not post your reply'));
    } finally {
      setBusyKey(null);
    }
  };

  const deleteReply = async (product, review) => {
    if (!window.confirm('Delete your reply? Customers will no longer see it.')) return;
    const key = keyOf(product._id, review._id);
    setBusyKey(key);
    try {
      await api.delete(`/products/${product._id}/reviews/${review._id}/reply`);
      patchReview(product._id, review._id, { reply: undefined });
      showNotice('success', 'Reply deleted.');
    } catch (error) {
      showNotice('error', describeError(error, 'Could not delete your reply'));
    } finally {
      setBusyKey(null);
    }
  };

  const allReviews = useMemo(() => products.flatMap((p) => p.reviews), [products]);
  const needsReply = allReviews.filter((r) => !r.reply?.message).length;

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products
      .map((p) => {
        const productMatches = !q || p.name.toLowerCase().includes(q);
        const reviews = [...p.reviews]
          .filter((r) => {
            const replied = Boolean(r.reply?.message);
            if (filter === 'needs' && replied) return false;
            if (filter === 'replied' && !replied) return false;
            if (productMatches) return true;
            return r.customerName?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q);
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
        return { ...p, visibleReviews: reviews };
      })
      .filter((p) => p.visibleReviews.length > 0)
      .sort((a, b) => new Date(b.visibleReviews[0].createdAt) - new Date(a.visibleReviews[0].createdAt));
  }, [products, searchQuery, filter]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-700">{loadError}</p>
        <button onClick={() => window.location.reload()} className="mt-5 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-[#128C7E] flex-shrink-0" />
            Customer Reviews
          </h2>
          <p className="text-gray-500 mt-1 text-sm">See what customers say about your products, and reply to them.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25D366] text-base sm:text-sm"
          />
        </div>
      </div>

      {notice.text && (
        <div
          role="status"
          className={`mb-5 p-3 sm:p-4 rounded-xl flex items-start border ${
            notice.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {notice.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{notice.text}</span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center flex flex-col items-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Star className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500 max-w-md text-sm sm:text-base">
            When customers leave feedback on your storefront, their ratings and comments will appear here, and you can reply to each one.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-5 sm:mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-gray-500 font-semibold">Reviews</p>
              <p className="text-xl sm:text-3xl font-black text-gray-900">{allReviews.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-gray-500 font-semibold">Need a reply</p>
              <p className={`text-xl sm:text-3xl font-black ${needsReply > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{needsReply}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-gray-500 font-semibold">Average</p>
              <p className="text-xl sm:text-3xl font-black text-gray-900 flex items-center justify-center gap-1">
                {average(allReviews).toFixed(1)} <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-5" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  filter === f.value ? 'bg-[#128C7E] border-[#128C7E] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#128C7E]'
                }`}
              >
                {f.label}{f.value === 'needs' && needsReply > 0 ? ` (${needsReply})` : ''}
              </button>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">
                {filter === 'needs' && !searchQuery ? "You're all caught up. Every review has a reply." : 'No reviews match that.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {visibleProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {product.images?.length > 0 ? (
                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                      <div className="flex flex-wrap items-center text-sm text-gray-500 mt-0.5 gap-x-2">
                        <span className="font-semibold text-[#128C7E]">
                          {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          Avg: {average(product.reviews).toFixed(1)} <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {product.visibleReviews.map((review) => {
                      const key = keyOf(product._id, review._id);
                      return (
                        <ReviewCard
                          key={review._id || key}
                          review={review}
                          busy={busyKey === key}
                          editing={editingKey === key}
                          draft={editingKey === key ? draft : ''}
                          error={editingKey === key ? cardError : ''}
                          onDraft={setDraft}
                          onStartReply={() => startReply(product, review)}
                          onCancel={cancelReply}
                          onSave={() => saveReply(product, review)}
                          onDelete={() => deleteReply(product, review)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
