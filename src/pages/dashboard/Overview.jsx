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
  PlayCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import SetupProgressCard from '../../components/SetupProgressCard';

const HELP_DISMISSED_KEY = 'vendira_help_popup_dismissed';

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

const readDismissed = () => {
  try {
    return localStorage.getItem(HELP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

const Overview = () => {
  const [storeName, setStoreName] = useState('Vendor');
  const [storeSlug, setStoreSlug] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({ products: 0, views: 0, clicks: 0 });
  const [waRecent, setWaRecent] = useState(null);
  const [whatsappMissing, setWhatsappMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // idle | copied | failed
  const copyTimer = useRef(null);

  // Help popup
  const [tutorialCount, setTutorialCount] = useState(0);
  const [helpDismissed, setHelpDismissed] = useState(readDismissed);
  const [helpOpen, setHelpOpen] = useState(false);

  // Only offer the share link once the store is live; prefer the short link when one exists
  const storeUrl =
    storeSlug && isLive
      ? `${window.location.origin}${shortCode ? `/${shortCode}` : `/store/${storeSlug}`}`
      : '';
  const shareMessage = `Shop at ${storeName === 'Vendor' ? 'my store' : storeName} on Vendira. Browse everything and order straight on WhatsApp:`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const helpEligible = tutorialCount > 0 && !helpDismissed;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    // Each request loads separately, so one failure doesn't hide the rest
    try {
      const storeRes = await api.get('/stores/my-store');
      const storeData = storeRes.data?.data?.store;
      if (storeData) {
        setStoreName(storeData.name || storeData.businessName || 'Vendor');
        setStoreSlug(storeData.slug || '');
        setShortCode(storeData.shortCode || '');
        setIsLive(storeData.isPublished !== false);
        // null means the saved number can't produce a working WhatsApp link
        setWhatsappMissing(storeData.whatsappDigits === null);
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

    try {
      const waRes = await api.get('/products/analytics/whatsapp');
      setWaRecent(waRes.data?.data?.last7Days ?? null);
    } catch {
      // optional stat: stay quiet if it fails
    }
  }, []);

  useEffect(() => {
    fetchDashboardData().finally(() => setLoading(false));
    return () => clearTimeout(copyTimer.current);
  }, [fetchDashboardData]);

  // Find out whether there are any tutorials, so the popup never points to an empty page
  useEffect(() => {
    if (helpDismissed) return;
    let cancelled = false;
    api
      .get('/guide')
      .then((res) => {
        if (!cancelled) setTutorialCount(res.data?.data?.tutorials?.length || 0);
      })
      .catch(() => {}); // the popup is optional; stay quiet if this fails
    return () => { cancelled = true; };
  }, [helpDismissed]);

  // Slide the popup in a moment after the dashboard has loaded
  useEffect(() => {
    if (loading || !helpEligible) return;
    const timer = setTimeout(() => setHelpOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [loading, helpEligible]);

  const dismissHelp = () => {
    setHelpOpen(false);
    try {
      localStorage.setItem(HELP_DISMISSED_KEY, '1');
    } catch {
      // storage unavailable: it will simply show again next visit
    }
    // Let the slide-out animation finish before removing the popup
    setTimeout(() => setHelpDismissed(true), 300);
  };

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
            {tutorialCount > 0 && (
              <Link
                to="/dashboard/guide"
                className="inline-flex items-center mt-3 text-sm font-bold text-white underline underline-offset-4 decoration-white/50 hover:decoration-white"
              >
                <PlayCircle className="w-4 h-4 mr-1.5" /> Confused? Watch the tutorials
              </Link>
            )}
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

      {/* WHATSAPP NUMBER WARNING */}
      {whatsappMissing && (
        <div role="alert" className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-amber-900 text-sm">Customers can't message you on WhatsApp yet</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Your WhatsApp number is missing or not valid, so the WhatsApp button on your store is switched off.{' '}
              <Link to="/dashboard/store" className="font-bold underline">Fix it now</Link>
            </p>
          </div>
        </div>
      )}

      {/* SETUP PROGRESS */}
      <SetupProgressCard />



