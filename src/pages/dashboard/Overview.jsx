import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  PlusCircle,
  Store,
  RefreshCcw,
  Copy,
  Check,
  Share2,
  MessageCircle,
} from 'lucide-react';
import api from '../../api/axios';

// Clipboard API needs HTTPS; fall back to the old method elsewhere (e.g. plain http on a LAN)
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy approach
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

const Overview = () => {
  const [storeName, setStoreName] = useState('Vendor');
  const [storeSlug, setStoreSlug] = useState('');
  const [stats, setStats] = useState({ products: 0, views: 0, clicks: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // idle | copied | failed
  const copyTimer = useRef(null);

  const storeUrl = storeSlug ? `${window.location.origin}/store/${storeSlug}` : '';
  const shareMessage = `Shop at ${storeName === 'Vendor' ? 'my store' : storeName} on Vendira. Browse everything and order straight on WhatsApp:`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    // Store and products load separately, so a products error doesn't hide the share link
    try {
      const storeRes = await api.get('/stores/my-store');
      const storeData = storeRes.data?.data?.store;
      if (storeData) {
        setStoreName(storeData.name || storeData.businessName || 'Vendor');
        setStoreSlug(storeData.slug || '');
      }
    } catch (error) {
      if (error.response?.status !== 404) console.error('Store load failed:', error.response?.status);
    }

    try {
      const productsRes = await api.get('/products');
      const products = productsRes.data?.data?.products || [];
      setStats({
        products: products.length,
        views: products.reduce((sum, item) => sum + (item.views || 0), 0),
        clicks: products.reduce((sum, item) => sum + (item.whatsappClicks || 0), 0),
      });
    } catch (error) {
      console.error('Products load failed:', error.response?.status);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData().finally(() => setLoading(false));
    return () => clearTimeout(copyTimer.current);
  }, [fetchDashboardData]);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(storeUrl);
    setCopyState(ok ? 'copied' : 'failed');
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `${shareMessage}\n${storeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: storeName, text: shareMessage, url: storeUrl });
    } catch {
      // user closed the share sheet; nothing to do
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 sm:space-y-8 max-w-6xl mx-auto">
        <div className="h-40 bg-gray-200 rounded-3xl w-full"></div>
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">

      {/* HERO GREETING */}
      <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] rounded-3xl p-5 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-20 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6">
          <div className="min-w-0">
            <p className="text-emerald-100 font-semibold tracking-wide uppercase text-xs sm:text-sm mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 break-words">
              {getGreeting()}, {storeName}! 👋
            </h1>
            <p className="text-emerald-50 max-w-xl text-sm sm:text-base">
              Welcome to your Vendira control center. Manage your products, update your store settings, and watch your WhatsApp orders roll in.
            </p>
          </div>

          <button
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="flex items-center justify-center px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl backdrop-blur-sm transition-all disabled:opacity-50 w-full sm:w-auto flex-shrink-0"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Live Stats'}
          </button>
        </div>
      </div>

      {/* SHARE YOUR STORE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-emerald-50 text-[#128C7E] p-2.5 rounded-xl flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Share your store</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Send this link to customers, or put it in your WhatsApp status and social bios.
            </p>
          </div>
        </div>

        {storeUrl ? (
          <>
            {/* Link + copy */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                readOnly
                value={storeUrl}
                aria-label="Your store link"
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-700 font-mono truncate focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center px-5 py-3 rounded-xl font-bold text-sm transition-colors sm:w-36 ${
                  copyState === 'copied'
                    ? 'bg-emerald-100 text-emerald-700'
                    : copyState === 'failed'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {copyState === 'copied' ? (
                  <><Check className="w-4 h-4 mr-2" /> Copied!</>
                ) : copyState === 'failed' ? (
                  'Copy manually'
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> Copy link</>
                )}
              </button>
            </div>

            {copyState === 'failed' && (
              <p className="text-xs text-red-600 mt-2">
                Your browser blocked copying. Tap the link above, select all, and copy it.
              </p>
            )}

            {/* Share buttons */}
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> Share on WhatsApp
              </button>

              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" /> More options
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Set up your store to get your shareable link.</p>
            <Link to="/dashboard/store" className="inline-block mt-3 px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors">
              Set up my store
            </Link>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-3.5 sm:p-4 rounded-xl text-[#128C7E] mr-4 sm:mr-5">
            <Package className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Total Products</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.products.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-3.5 sm:p-4 rounded-xl text-blue-600 mr-4 sm:mr-5">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Product Views</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.views.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="bg-green-50 p-3.5 sm:p-4 rounded-xl text-[#25D366] mr-4 sm:mr-5">
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">WhatsApp Clicks</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.clicks.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 sm:mb-6">Quick Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link to="/dashboard/products" className="group flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#25D366] hover:bg-emerald-50 transition-all text-center">
            <PlusCircle className="w-8 h-8 text-gray-400 group-hover:text-[#25D366] mb-3 transition-colors" />
            <span className="font-bold text-gray-700 group-hover:text-gray-900">Add New Product</span>
            <span className="text-xs text-gray-500 mt-1">Upload items to your catalogue</span>
          </Link>

          <Link to="/dashboard/store" className="group flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#128C7E] hover:bg-emerald-50 transition-all text-center">
            <Store className="w-8 h-8 text-gray-400 group-hover:text-[#128C7E] mb-3 transition-colors" />
            <span className="font-bold text-gray-700 group-hover:text-gray-900">Edit Store Profile</span>
            <span className="text-xs text-gray-500 mt-1">Update your name & number</span>
          </Link>

          {storeSlug ? (
            <a href={`/store/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-gray-100 bg-gray-50 rounded-xl hover:border-gray-300 hover:bg-gray-100 transition-all text-center min-w-0">
              <ExternalLink className="w-8 h-8 text-gray-500 group-hover:text-gray-700 mb-3 transition-colors" />
              <span className="font-bold text-gray-700 group-hover:text-gray-900">View Public Store</span>
              <span className="text-xs mt-1 text-[#128C7E] truncate max-w-full">/{storeSlug}</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-gray-100 bg-gray-50 rounded-xl text-center opacity-60">
              <ExternalLink className="w-8 h-8 text-gray-300 mb-3" />
              <span className="font-bold text-gray-400">View Public Store</span>
              <span className="text-xs text-gray-400 mt-1">Setup store first</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Overview;
