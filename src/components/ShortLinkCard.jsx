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
  return (
    <section id="short-link" className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6" aria-label="Short link">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-50 text-[#128C7E] p-2.5 rounded-xl flex-shrink-0">
          <Link2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900">Short link</h3>
          <p className="text-sm text-gray-500 mt-0.5">A shorter version of your store link that still carries your brand name. Perfect for your bio.</p>
        </div>
      </div>

      {notice.text && (
        <div
          role="status"
          className={`mt-4 p-3 rounded-xl flex items-start border text-sm font-medium ${
            notice.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {notice.type === 'error' ? <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />}
          <span className="break-words min-w-0">{notice.text}</span>
        </div>
      )}

      {/* The link they have now */}
      {shortLink ? (
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4">
          <p className="text-xs font-bold text-emerald-800 mb-1.5">Your short link</p>
          <p className="font-mono text-sm sm:text-base text-gray-900 break-all">{stripProtocol(shortLink)}</p>
          <p className="text-xs text-emerald-800 mt-1">
            {shortChars} characters, {Math.max(longChars - shortChars, 0)} shorter than your full link ({longChars}).
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button
              type="button"
              onClick={() => copy('bio', stripProtocol(shortLink))}
              className="flex items-center justify-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl"
            >
              {copied === 'bio' ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy for my bio</>}
            </button>
            <button
              type="button"
              onClick={() => copy('full', shortLink)}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl"
            >
              {copied === 'full' ? <><Check className="w-4 h-4 mr-2 text-emerald-600" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy with https://</>}
            </button>
          </div>
          {store.isPublished === false && (
            <p className="text-xs text-amber-700 mt-3">Your store isn't published yet, so this link shows "Store not found" until you publish it.</p>
          )}
        </div>
      ) : (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-xs text-gray-500">Your link right now ({longChars} characters)</p>
          <p className="font-mono text-xs sm:text-sm text-gray-700 break-all mt-0.5">{stripProtocol(longLink)}</p>
        </div>
      )}

      {/* Choose or change the short name */}
      <div className="mt-5">
        <label htmlFor="short-code" className="block text-sm font-semibold text-gray-700 mb-1">
          {savedCode ? 'Change your short name' : 'Choose your short name'}
        </label>
        <div className="flex flex-col sm:flex-row rounded-xl shadow-sm overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#25D366] focus-within:border-[#25D366]">
          <span className="px-3 py-2 sm:py-0 sm:flex sm:items-center bg-gray-50 text-gray-500 text-xs sm:text-sm border-b sm:border-b-0 sm:border-r border-gray-300 truncate sm:max-w-[60%]">
            {host}/
          </span>
          <input
            id="short-code"
            type="text"
            value={input}
            maxLength={SHORT_MAX + 2}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            className={inputClass}
            placeholder="e.g. gadgethub"
            aria-describedby="short-code-status"
          />
        </div>

        <button
          type="button"
          onClick={handleSuggest}
          disabled={!brandName}
          className="mt-2 inline-flex items-center text-xs font-bold text-[#128C7E] hover:text-[#075E54] disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          {suggestIdx === 0 ? 'Suggest a short brand name' : 'Suggest another'}
        </button>

        <p id="short-code-status" className="text-xs mt-1.5 min-h-[1rem]" aria-live="polite">
          {check.state === 'checking' && <span className="text-gray-500">Checking...</span>}
          {check.state === 'available' && <span className="text-emerald-700 font-semibold">{host}/{code} is available.</span>}
          {check.state === 'current' && <span className="text-gray-500">This is your current short link.</span>}
          {(check.state === 'unavailable' || check.state === 'error') && <span className="text-red-600">{check.message}</span>}
          {check.state === 'idle' && <span className="text-gray-500">{SHORT_MAX} characters at most. Letters, numbers and hyphens.</span>}
        </p>

        {ideas.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Ideas:</span>
            {ideas.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setInput(idea)}
                className="text-xs font-bold text-[#128C7E] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full"
              >
                {idea}
              </button>
            ))}
          </div>
        )}

        {savedCode && code !== savedCode && code && (
          <p className="text-xs text-amber-600 mt-3">
            Changing your short name breaks the old short link anywhere you've already shared it.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            type="button"
            onClick={() => save(code)}
            disabled={!canSave}
            className="flex items-center justify-center px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : savedCode ? 'Save new short link' : 'Create short link'}
          </button>
          {savedCode && (
            <button
              type="button"
              onClick={removeShortLink}
              disabled={saving}
              className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-red-600 font-bold rounded-xl text-sm disabled:opacity-60"
            >
              Remove short link
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ShortLinkCard;