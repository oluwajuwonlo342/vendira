import { useState, useEffect } from 'react';
import { Link2, Copy, Check, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { copyToClipboard } from '../utils/helpers';
import {
  SHORT_MAX,
  cleanShortCode,
  validateShortCodeFormat,
  stripProtocol,
  suggestShortCodes,
} from '../utils/shortLink';

const inputClass =
  'flex-1 min-w-0 w-full px-4 py-3 text-base sm:text-sm focus:outline-none';

// Words that add nothing to a short brand name
const BRAND_FILLER = new Set([
  'the', 'and', 'of', 'for', 'a', 'an', 'brand', 'brands', 'store', 'stores',
  'shop', 'shops', 'ltd', 'limited', 'enterprises', 'enterprise', 'global',
  'nig', 'nigeria', 'official',
]);

// "The Adekunle Iwajomi Brand" -> adekunle, adekunle-iwajomi, adekunleiwajomi, adekunle47
const buildShortNames = (name) => {
  const words = (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && !BRAND_FILLER.has(w));
  if (!words.length) return [];

  const first = words[0];
  const two = words.slice(0, 2);
  const suffix = String(Math.floor(10 + Math.random() * 90));

  const options = [
    first.length >= 4 ? first : two.join('-'),
    two.join('-'),
    two.join(''),
    `${first.slice(0, Math.max(SHORT_MAX - 2, 1))}${suffix}`,
  ]
    .map((o) => cleanShortCode(o).slice(0, SHORT_MAX).replace(/-+$/, ''))
    .filter(Boolean);

  return [...new Set(options)];
};

const ShortLinkCard = ({ storeName = '' }) => {
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error | nostore
  const [store, setStore] = useState(null);
  const [input, setInput] = useState('');
  const [check, setCheck] = useState({ state: 'idle', message: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState('');
  const [suggestIdx, setSuggestIdx] = useState(0);

  const origin = window.location.origin;
  const host = window.location.host;
  const savedCode = store?.shortCode || '';
  const code = cleanShortCode(input);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/stores/my-store');
        if (cancelled) return;
        const loaded = res.data?.data?.store;
        setStore(loaded);
        setInput(loaded?.shortCode || '');
        setLoadState('ready');
      } catch (error) {
        if (cancelled) return;
        setLoadState(error.response?.status === 404 ? 'nostore' : 'error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Start the suggestion cycle again when the store name changes
  useEffect(() => {
    setSuggestIdx(0);
  }, [storeName]);

  // Check the typed name after the vendor pauses, ignoring answers that arrive late
  useEffect(() => {
    if (loadState !== 'ready') return undefined;

    if (!code) {
      setCheck({ state: 'idle', message: '' });
      return undefined;
    }
    const formatProblem = validateShortCodeFormat(code);
    if (formatProblem) {
      setCheck({ state: 'unavailable', message: formatProblem });
      return undefined;
    }
    if (code === savedCode) {
      setCheck({ state: 'current', message: '' });
      return undefined;
    }

    setCheck({ state: 'checking', message: '' });
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/stores/short-code/check', { params: { code } });
        if (cancelled) return;
        const d = res.data?.data;
        setCheck(d?.available ? { state: 'available', message: '' } : { state: 'unavailable', message: d?.message || 'That name is not available.' });
      } catch {
        if (!cancelled) setCheck({ state: 'error', message: "Couldn't check that name right now. You can still try to save it." });
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, savedCode, loadState]);

  const save = async (value) => {
    setSaving(true);
    setNotice({ type: '', text: '' });
    try {
      const res = await api.put('/stores/short-code', { shortCode: value });
      const updated = res.data?.data?.store;
      setStore(updated);
      setInput(updated?.shortCode || '');
      setNotice({ type: 'success', text: value ? 'Your short link is ready. Copy it into your bio.' : 'Short link removed.' });
    } catch (error) {
      console.error('Save short link failed:', error.response?.status, error.response?.data);
      setNotice({
        type: 'error',
        text: error.response
          ? error.response.data?.error || 'Could not save your short link.'
          : 'Cannot reach the server. It may be waking up, so please try again in a moment.',
      });
    } finally {
      setSaving(false);
    }
  };

  const removeShortLink = () => {
    if (!window.confirm('Remove your short link? Anyone using it will see "Store not found".')) return;
    save('');
  };

  const copy = async (key, text) => {
    const ok = await copyToClipboard(text);
    setCopied(ok ? key : '');
    setTimeout(() => setCopied(''), 2500);
  };

  if (loadState === 'loading') return <div className="mb-6 h-40 bg-gray-100 rounded-2xl animate-pulse"></div>;
  if (loadState !== 'ready') return null; // no store yet, or a load error: this card is optional

  const brandName = storeName.trim() || store.name || store.businessName || store.slug || '';

  const handleSuggest = () => {
    // Skip the name they already have so every click shows something new
    const options = buildShortNames(brandName).filter((o) => o !== savedCode);
    if (!options.length) return;
    setInput(options[suggestIdx % options.length]);
    setSuggestIdx((i) => i + 1);
  };

  const longLink = `${origin}/store/${store.slug}`;
  const shortLink = savedCode ? `${origin}/${savedCode}` : '';
  const longChars = stripProtocol(longLink).length;
  const shortChars = shortLink ? stripProtocol(shortLink).length : 0;
  const ideas = suggestShortCodes(store.name || store.businessName || store.slug, savedCode);
  const canSave = Boolean(code) && code !== savedCode && check.state === 'available' && !saving;