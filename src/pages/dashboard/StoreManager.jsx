import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Store,
  AlertCircle,
  CheckCircle,
  Camera,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import api from '../../api/axios';
import EmptyState from '../../components/EmptyState';
// 1. Imports
import { CURRENCIES } from '../../utils/money';
import { normalizeWhatsapp, buildWhatsAppUrl, WHATSAPP_HELP } from '../../utils/whatsapp';

// 2. formData starts with two extra fields:
//    { name: '', slug: '', description: '', whatsappNumber: '', currency: 'NGN', whatsappCta: 'order' }
//    and when the store loads, add:
//      currency: store.currency || 'NGN',
//      whatsappCta: store.whatsappCta || 'order',

// 3. In buildFormData, next to the other appends:
submitData.append('currency', formData.currency);
submitData.append('whatsappCta', formData.whatsappCta);

// 4. Before the return:
const waDigits = normalizeWhatsapp(formData.whatsappNumber);
const waTyped = formData.whatsappNumber.trim().length > 0;

// 5. At the top of handleSubmit, after `if (preparing) return;`
if (!waDigits) return showMessage('error', WHATSAPP_HELP);

const MAX_PICK_MB = 15; // reject only absurdly large originals; everything else is shrunk first
const UPLOAD_TIMEOUT_MS = 120000;

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clipboard API needs HTTPS; fall back to the old method elsewhere
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

// Shrinks a photo in the browser so uploads are small and fast on slow mobile data.
// Falls back to the original file if anything goes wrong.
const compressImage = (file, maxSide, quality = 0.82) =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return resolve(file);
    }
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 300 * 1024) return resolve(file); // already small

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

      // JPEGs stay JPEG; PNGs become WebP so logo transparency is kept
      const outType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
          const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
          resolve(new File([blob], name, { type: blob.type }));
        },
        outType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

const describeError = (error) => {
  if (error.response) {
    return (
      error.response.data?.error ||
      error.response.data?.message ||
      `Save failed (error ${error.response.status}). Please try again.`
    );
  }
  if (error.code === 'ECONNABORTED') {
    return 'The upload took too long and timed out. Try again on a stronger connection.';
  }
  return 'Could not reach the server. It may be waking up (this can take up to a minute) or your connection dropped. Please try again.';
};

const StoreManager = () => {
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', whatsappNumber: '' });
  const [savedSlug, setSavedSlug] = useState(''); // the slug that is actually live on the server

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const [hasStore, setHasStore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copyState, setCopyState] = useState('idle'); // idle | copied | failed

  const objectUrls = useRef([]);
  const copyTimer = useRef(null);

  const storeUrl = savedSlug ? `${window.location.origin}/store/${savedSlug}` : '';
  const slugChanged = hasStore && savedSlug && formData.slug.trim() !== savedSlug;

  useEffect(() => {
    const fetchMyStore = async () => {
      try {
        const response = await api.get('/stores/my-store');
        const store = response.data?.data?.store;
        if (store) {
          setFormData({
            name: store.name || store.businessName || '',
            slug: store.slug || '',
            description: store.description || '',
            whatsappNumber: store.whatsappNumber || '',
          });
          setSavedSlug(store.slug || '');
          if (store.logo?.url) setLogoPreview(store.logo.url);
          if (store.coverImage?.url) setCoverPreview(store.coverImage.url);
          setHasStore(true);
        }
      } catch (error) {
        // 404 means "no store yet". Anything else is a real failure, so don't show the
        // "set up your store" screen, which could lead to creating a duplicate store.
        if (error.response?.status !== 404) {
          console.error('Error fetching store:', error);
          setLoadFailed(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyStore();
  }, [attempt]);

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      clearTimeout(copyTimer.current);
    };
  }, []);

  const retryLoad = () => {
    setLoadFailed(false);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  // The dashboard scrolls inside its own container, so scroll both it and the window
  const showMessage = (type, text) => {
    setMessage({ type, text });
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCopy = async () => {
    const ok = await copyToClipboard(storeUrl);
    setCopyState(ok ? 'copied' : 'failed');
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2500);
  };

  const handleWhatsAppShare = () => {
    const name = formData.name.trim() || 'my store';
    const text = `Shop at ${name} on Vendira. Browse everything and order straight on WhatsApp:\n${storeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const pickImage = async (e, setFile, setPreview, maxSide) => {
    const original = e.target.files[0];
    e.target.value = '';
    if (!original) return;

    if (original.size > MAX_PICK_MB * 1024 * 1024) {
      return showMessage('error', `That image is too large. Please choose one under ${MAX_PICK_MB}MB.`);
    }

    setPreparing(true);
    const file = await compressImage(original, maxSide);
    setPreparing(false);

    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setFile(file);
    setPreview(url);
  };

  const buildFormData = () => {
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('slug', formData.slug.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('whatsappNumber', formData.whatsappNumber.trim());
    if (logoFile) submitData.append('logo', logoFile);
    if (coverFile) submitData.append('coverImage', coverFile);
    return submitData;
  };

  const sendRequest = () => {
    const config = {
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
      },
    };
    const body = buildFormData();
    return hasStore ? api.put('/stores/my-store', body, config) : api.post('/stores', body, config);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (preparing) return;
    setSaving(true);
    setProgress(0);
    setStatusText('');
    setMessage({ type: '', text: '' });

    try {
      let res;
      try {
        res = await sendRequest();
      } catch (firstError) {
        // Retry once if nothing came back (sleeping server or dropped connection).
        // Only for updates: repeating a create could duplicate the store.
        if (hasStore && !firstError.response) {
          setStatusText('Connection hiccup. Retrying...');
          await sleep(4000);
          setProgress(0);
          res = await sendRequest();
        } else {
          throw firstError;
        }
      }

      const saved = res.data?.data?.store;
      if (saved?.logo?.url) setLogoPreview(saved.logo.url);
      if (saved?.coverImage?.url) setCoverPreview(saved.coverImage.url);
      if (saved?.slug) {
        setFormData((prev) => ({ ...prev, slug: saved.slug }));
        setSavedSlug(saved.slug);
      }

      setLogoFile(null);
      setCoverFile(null);
      showMessage('success', hasStore ? 'Store updated successfully!' : 'Store created successfully!');
      setHasStore(true);
    } catch (error) {
      console.error('Save store failed:', error.response?.status, error.response?.data, error.code, error.message);
      showMessage('error', describeError(error));
    } finally {
      setSaving(false);
      setStatusText('');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-96 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="max-w-3xl mx-auto text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-semibold">Could not load your store details.</p>
        <p className="text-sm text-gray-500 mt-1">The server may be waking up or your connection dropped.</p>
        <button
          type="button"
          onClick={retryLoad}
          className="mt-5 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Vendors without a store are guided through setup instead of seeing this form
  if (!hasStore) {
    return (
      <EmptyState
        icon={Store}
        title="You haven't set up your store yet"
        description="We'll guide you step by step. It takes about 3 minutes and your progress is saved as you go."
        actionLabel="Start store setup"
        to="/dashboard/setup"
      />
    );
  }

  const hasNewImages = Boolean(logoFile || coverFile);

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Store className="w-6 h-6 mr-2 text-[#128C7E] flex-shrink-0" />
          Store Settings
        </h2>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Configure how customers see your brand and where your orders are sent.
        </p>
      </div>

      {message.text && (
        <div
          role="status"
          className={`mb-6 p-3 sm:p-4 rounded-xl flex items-start border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium break-words min-w-0">{message.text}</span>
        </div>
      )}

      {/* YOUR STORE LINK */}
      {storeUrl && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="font-bold text-gray-900">Your store link</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-3">Share this with your customers, or put it in your bio and WhatsApp status.</p>

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
              type="button"
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

          <div className="mt-2 sm:mt-3 grid grid-cols-2 sm:flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center px-4 sm:px-5 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </button>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 sm:px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Open store
            </a>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-6 sm:space-y-8"
      >
        {/* Cover Image */}
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Store Banner (Cover Image)</h3>
          <div className="relative w-full h-32 sm:h-48 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden group cursor-pointer hover:border-[#25D366] transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400 px-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">Tap to upload banner (optional)</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            {coverPreview && (
              <span className="sm:hidden absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Change
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              aria-label="Upload store banner"
              onChange={(e) => pickImage(e, setCoverFile, setCoverPreview, 1600)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Wide images work best. Photos are shrunk automatically so they upload quickly.
          </p>
        </div>

        {/* Logo */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-gray-100 text-center sm:text-left">
          <div className="relative flex-shrink-0">
            <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden group cursor-pointer hover:border-[#25D366] transition-colors">
              {logoPreview ? (
                <img src={logoPreview} alt="Store logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black/40 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                aria-label="Upload brand logo"
                onChange={(e) => pickImage(e, setLogoFile, setLogoPreview, 800)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="sm:hidden absolute -bottom-1 -right-1 bg-[#128C7E] text-white p-1.5 rounded-full shadow pointer-events-none">
              <Camera className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">Brand Logo</h3>
            <p className="text-sm text-gray-500 mt-1">Upload your business logo. Recommended size: 500x500px.</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WEBP.</p>
          </div>
        </div>

        {/* Name + slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Store Name</label>
            <input
              id="name"
              type="text"
              name="name"
              required
              autoComplete="organization"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. My Gadget Hub"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="slug" className="block text-sm font-semibold text-gray-700 mb-1">Store URL (Slug)</label>
            <div className="flex flex-col sm:flex-row rounded-xl shadow-sm overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#25D366] focus-within:border-[#25D366]">
              <span className="px-3 py-2 sm:py-0 sm:flex sm:items-center bg-gray-50 text-gray-500 text-xs sm:text-sm border-b sm:border-b-0 sm:border-r border-gray-300 truncate sm:max-w-[55%]">
                {window.location.host}/store/
              </span>
              <input
                id="slug"
                type="text"
                name="slug"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={formData.slug}
                onChange={handleChange}
                className="flex-1 min-w-0 w-full px-4 py-3 text-base sm:text-sm focus:outline-none"
                placeholder="my-gadget-hub"
              />
            </div>
            {slugChanged && (
              <p className="text-xs text-amber-600 mt-1.5">
                Changing your URL breaks any links you've already shared. Customers using the old link will see "Store not found".
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="whatsappNumber" className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number for Orders</label>
          <input
            id="whatsappNumber"
            type="tel"
            inputMode="tel"
            name="whatsappNumber"
            required
            autoComplete="tel"
            value={formData.whatsappNumber}
            onChange={handleChange}
            className={`${inputClass} md:w-1/2`}
            placeholder="08012345678"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Store Description</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            maxLength={500}
            value={formData.description}
            onChange={handleChange}
            className={`${inputClass} resize-y`}
            placeholder="What do you sell? This appears on your storefront header."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/500</p>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          {saving && hasNewImages && (
            <div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#25D366] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{statusText || `Uploading images... ${progress}%`}</p>
            </div>
          )}
          {saving && !hasNewImages && statusText && <p className="text-xs text-gray-500">{statusText}</p>}

          <div className="flex sm:justify-end">
            <button
              type="submit"
              disabled={saving || preparing}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 sm:py-3 bg-[#128C7E] text-white font-bold rounded-xl hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2" />
              {preparing
                ? 'Preparing image...'
                : saving
                  ? 'Saving...'
                  : 'Save Store Details'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StoreManager;
