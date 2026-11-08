import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import { CURRENCIES } from '../../utils/money';
import { normalizeWhatsapp, buildWhatsAppUrl, WHATSAPP_HELP } from '../../utils/whatsapp';
import { suggestSlugs } from '../../utils/slug';
import LocationFields from '../../components/LocationFields';
import ShortLinkCard from '../../components/ShortLinkCard';

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
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    whatsappNumber: '',
    currency: 'NGN',
    whatsappCta: 'order',
    state: '',
    city: '',
    address: '',
    hasPhysicalStore: false,
    mapLink: '',
  });
  const [savedSlug, setSavedSlug] = useState(''); // the slug that is actually live on the server
  const [isLive, setIsLive] = useState(true);
  const [suggestIdx, setSuggestIdx] = useState(0);

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

  // What a customer's WhatsApp link would use, or null if the number can't work
  const waDigits = normalizeWhatsapp(formData.whatsappNumber);
  const waTyped = formData.whatsappNumber.trim().length > 0;

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
            currency: store.currency || 'NGN',
            whatsappCta: store.whatsappCta || 'order',
            state: store.location?.state || '',
            city: store.location?.city || '',
            address: store.location?.address || '',
            hasPhysicalStore: Boolean(store.hasPhysicalStore),
            mapLink: store.mapLink || '',
          });
          setSavedSlug(store.slug || '');
          setIsLive(store.isPublished !== false);
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

  const handleChange = (e) => {
    if (e.target.name === 'name') setSuggestIdx(0);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuggestSlug = () => {
    const options = suggestSlugs(formData.name);
    if (!options.length) return;
    const pick = options[suggestIdx % options.length];
    setFormData((prev) => ({ ...prev, slug: pick }));
    setSuggestIdx((i) => i + 1);
  };

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
    submitData.append('currency', formData.currency);
    submitData.append('whatsappCta', formData.whatsappCta);
    if (logoFile) submitData.append('logo', logoFile);
    if (coverFile) submitData.append('coverImage', coverFile);
    submitData.append('state', (formData.state || '').trim());
    submitData.append('city', (formData.city || '').trim());
    submitData.append('address', (formData.address || '').trim());
    submitData.append('hasPhysicalStore', String(Boolean(formData.hasPhysicalStore)));
    submitData.append('mapLink', (formData.mapLink || '').trim());
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
    if (!waDigits) return showMessage('error', WHATSAPP_HELP);
    if (formData.hasPhysicalStore && !(formData.address || '').trim()) {
      return showMessage('error', 'Add your shop address, or switch off "I have a physical shop".');
    }

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
      if (saved) {
        setFormData((prev) => ({
          ...prev,
          slug: saved.slug || prev.slug,
          // The server stores the number in international form; show what was saved
          whatsappNumber: saved.whatsappNumber || prev.whatsappNumber,
          currency: saved.currency || prev.currency,
          whatsappCta: saved.whatsappCta || prev.whatsappCta,
          state: saved.location?.state ?? prev.state,
          city: saved.location?.city ?? prev.city,
          address: saved.location?.address ?? prev.address,
          hasPhysicalStore:
            saved.hasPhysicalStore !== undefined ? Boolean(saved.hasPhysicalStore) : prev.hasPhysicalStore,
          mapLink: saved.mapLink ?? prev.mapLink,
        }));
        if (saved.slug) setSavedSlug(saved.slug);
        setIsLive(saved.isPublished !== false);
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