import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Store, CheckCircle2, Circle, AlertCircle, ArrowRight, ArrowLeft, Camera,
  Image as ImageIcon, Rocket, Copy, Check, MessageCircle, ExternalLink,
  ListChecks, Plus, X, ChevronDown,
} from 'lucide-react';
import api from '../../api/axios';
import { compressImage, copyToClipboard } from '../../utils/helpers';
import StorePreview from '../../components/StorePreview';

const STEPS = [
  { n: 1, title: 'Store basics', hint: 'Your store name and WhatsApp number' },
  { n: 2, title: 'Branding', hint: 'Logo and cover image' },
  { n: 3, title: 'About your business', hint: 'Description, category and location' },
  { n: 4, title: 'Social links', hint: 'Optional: help customers find you' },
  { n: 5, title: 'Your first product', hint: 'Add something to sell' },
  { n: 6, title: 'Preview and publish', hint: 'Check it, then go live' },
];

const BUSINESS_TYPES = [
  'Fashion & Clothing', 'Beauty & Cosmetics', 'Food & Drinks', 'Electronics & Gadgets',
  'Home & Furniture', 'Health & Wellness', 'Jewelry & Accessories', 'Books & Stationery',
  'Art & Crafts', 'Services', 'Other',
];

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const EMPTY_PRODUCT = { name: '', price: '', description: '', category: '' };
const MAX_PICK_MB = 15;

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

const describe = (error, fallback = 'Something went wrong') => {
  if (error.response) {
    return error.response.data?.error || error.response.data?.message || `${fallback} (error ${error.response.status}).`;
  }
  if (error.code === 'ECONNABORTED') return 'That took too long and timed out. Try again on a stronger connection.';
  return 'Could not reach the server. It may be waking up (this can take up to a minute). Please try again.';
};

const seedForm = (d) => ({
  name: d.store?.businessName || d.owner?.name || '',
  whatsappNumber: d.store?.whatsappNumber || d.owner?.phone || '',
  description: d.store?.description || '',
  businessType: d.store?.businessType || '',
  state: d.store?.location?.state || '',
  city: d.store?.location?.city || '',
  address: d.store?.location?.address || '',
  instagram: d.store?.socialLinks?.instagram || '',
  facebook: d.store?.socialLinks?.facebook || '',
  tiktok: d.store?.socialLinks?.tiktok || '',
  twitter: d.store?.socialLinks?.twitter || '',
  website: d.store?.socialLinks?.website || '',
});

const Field = ({ id, label, hint, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

const ImagePicker = ({ label, hint, src, onPick, round = false }) => (
  <div className={round ? 'flex items-center gap-4' : ''}>
    <div className="relative flex-shrink-0">
      <div
        className={`relative border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center hover:border-[#25D366] transition-colors cursor-pointer ${
          round ? 'w-24 h-24 rounded-full' : 'w-full h-32 sm:h-44 rounded-2xl'
        }`}
      >
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-gray-400 px-3 text-center">
            {round ? <Store className="w-8 h-8" /> : <ImageIcon className="w-8 h-8 mb-1" />}
            {!round && <span className="text-sm">Tap to upload</span>}
          </div>
        )}
        <input type="file" accept="image/*" aria-label={label} onChange={onPick} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
      <span className="absolute -bottom-1 -right-1 bg-[#128C7E] text-white p-1.5 rounded-full shadow pointer-events-none">
        <Camera className="w-3.5 h-3.5" />
      </span>
    </div>
    {round && (
      <div className="min-w-0">
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
    )}
    {!round && (
      <div className="mt-2">
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
    )}
  </div>
);

const StoreSetup = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showList, setShowList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [otherType, setOtherType] = useState(false);

  const [logo, setLogo] = useState({ file: null, preview: '' });
  const [cover, setCover] = useState({ file: null, preview: '' });

  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [productFiles, setProductFiles] = useState([]);
  const [productPreviews, setProductPreviews] = useState([]);
  const [addingAnother, setAddingAnother] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const urls = useRef([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/onboarding');
        if (cancelled) return;
        const d = res.data?.data;
        setData(d);
        setForm(seedForm(d));
        setOtherType(Boolean(d.store?.businessType) && !BUSINESS_TYPES.includes(d.store.businessType));
        const asked = Number(searchParams.get('step'));
        const wanted = asked >= 1 && asked <= 6 ? asked : d.nextStep;
        setStep(d.store ? wanted : 1);
      } catch (error) {
        if (!cancelled) setLoadError(describe(error, 'Could not load your setup'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const created = urls.current;
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTop = () => {
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    scrollTop();
  };

  const goTo = (n, force = false) => {
    if (!force && !data?.store && n > 1) return showMessage('error', 'Start by naming your store. The other steps unlock after that.');
    setStep(n);
    setMessage({ type: '', text: '' });
    setShowList(false);
    setJustAdded(false);
    setSearchParams({ step: String(n) }, { replace: true });
    scrollTop();
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ---------- images ----------
  const pickSingle = async (e, setter, maxSide) => {
    const original = e.target.files[0];
    e.target.value = '';
    if (!original) return;
    if (original.size > MAX_PICK_MB * 1024 * 1024) return showMessage('error', `That image is too large. Please choose one under ${MAX_PICK_MB}MB.`);
    setPreparing(true);
    const file = await compressImage(original, maxSide);
    setPreparing(false);
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setter({ file, preview: url });
  };

  const pickProductImages = async (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = '';
    const room = 5 - productFiles.length;
    if (room <= 0) return showMessage('error', 'You can add up to 5 photos.');
    const chosen = picked.slice(0, room);
    if (chosen.some((f) => f.size > MAX_PICK_MB * 1024 * 1024)) return showMessage('error', `Please choose photos under ${MAX_PICK_MB}MB.`);
    setPreparing(true);
    const files = await Promise.all(chosen.map((f) => compressImage(f)));
    setPreparing(false);
    const previews = files.map((f) => URL.createObjectURL(f));
    urls.current.push(...previews);
    setProductFiles((prev) => [...prev, ...files]);
    setProductPreviews((prev) => [...prev, ...previews]);
  };

  const removeProductImage = (index) => {
    setProductFiles((prev) => prev.filter((_, i) => i !== index));
    setProductPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------- saving ----------
  const uploadConfig = {
    timeout: 180000,
    onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
  };

  const saveStore = async (fields, files = {}) => {
    setBusy(true);
    setProgress(0);
    setMessage({ type: '', text: '' });
    try {
      let res;
      if (files.logo || files.coverImage) {
        const body = new FormData();
        Object.entries(fields).forEach(([k, v]) => body.append(k, v ?? ''));
        if (files.logo) body.append('logo', files.logo);
        if (files.coverImage) body.append('coverImage', files.coverImage);
        res = await api.put('/onboarding/store', body, uploadConfig);
      } else {
        res = await api.put('/onboarding/store', fields);
      }
      const d = res.data?.data;
      setData(d);
      setForm((f) => ({ ...f, whatsappNumber: d.store?.whatsappNumber || f.whatsappNumber }));
      return true;
    } catch (error) {
      console.error('Save step failed:', error.response?.status, error.response?.data);
      showMessage('error', describe(error, 'Could not save'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitProduct = async () => {
    if (!product.name.trim()) return showMessage('error', 'Give your product a name.');
    if (!(Number(product.price) > 0)) return showMessage('error', 'Enter a price greater than zero.');
    if (!product.description.trim()) return showMessage('error', 'Add a short description. One line is enough.');

    setBusy(true);
    setProgress(0);
    setMessage({ type: '', text: '' });
    try {
      const body = new FormData();
      body.append('name', product.name.trim());
      body.append('price', product.price);
      body.append('description', product.description.trim());
      body.append('category', (product.category || form.businessType || '').trim());
      productFiles.forEach((f) => body.append('images', f));

      const res = await api.post('/onboarding/product', body, uploadConfig);
      setData(res.data?.data);
      setProduct(EMPTY_PRODUCT);
      setProductFiles([]);
      setProductPreviews([]);
      setAddingAnother(false);
      setJustAdded(true);
      scrollTop();
    } catch (error) {
      console.error('Add product failed:', error.response?.status, error.response?.data);
      showMessage('error', describe(error, 'Could not save the product'));
    } finally {
      setBusy(false);
    }
  };

  const publish = async (live) => {
    if (!live && !window.confirm('Unpublish your store? Customers will no longer be able to see it.')) return;
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/onboarding/publish', { publish: live });
      setData(res.data?.data);
      scrollTop();
    } catch (error) {
      showMessage('error', describe(error, 'Could not update your store'));
    } finally {
      setBusy(false);
    }
  };

  // One handler for the "continue" and "save and finish later" buttons of steps 1 to 4
  const submitStep = async ({ exit = false } = {}) => {
    const next = (n) => (exit ? navigate('/dashboard') : goTo(n, true));

    if (step === 1) {
      if (!form.name.trim()) return showMessage('error', 'Please enter your store name.');
      if (form.whatsappNumber.replace(/\D/g, '').length < 10) return showMessage('error', 'Enter a valid WhatsApp number, for example 08012345678.');
      if (await saveStore({ name: form.name, whatsappNumber: form.whatsappNumber })) next(2);
    } else if (step === 2) {
      if (!logo.file && !cover.file) return next(3);
      if (await saveStore({}, { logo: logo.file, coverImage: cover.file })) {
        setLogo({ file: null, preview: '' });
        setCover({ file: null, preview: '' });
        next(3);
      }
    } else if (step === 3) {
      const ok = await saveStore({
        description: form.description,
        businessType: form.businessType,
        state: form.state,
        city: form.city,
        address: form.address,
      });
      if (ok) next(4);
    } else if (step === 4) {
      const ok = await saveStore({
        instagram: form.instagram,
        facebook: form.facebook,
        tiktok: form.tiktok,
        twitter: form.twitter,
        website: form.website,
      });
      if (ok) next(5);
    }
  };

  const copyLink = async (url) => {
    const ok = await copyToClipboard(url);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2500);
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="h-96 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (loadError || !data || !form) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-100 p-8">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-700">{loadError || 'Could not load your setup.'}</p>
        <button onClick={() => window.location.reload()} className="mt-5 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl">Try again</button>
      </div>
    );
  }

  const { store, checklist, progress: prog, canPublish, isPublished, productCount, products } = data;
  const storeUrl = store?.slug ? `${window.location.origin}/store/${store.slug}` : '';
  const logoSrc = logo.preview || store?.logo?.url || '';
  const coverSrc = cover.preview || store?.coverImage?.url || '';
  const currentStep = STEPS[step - 1];
  const showProductForm = productCount === 0 || addingAnother;
  const setupComplete = isPublished && prog.percent === 100;

  const blockers = checklist.filter((i) => i.required && i.key !== 'publish' && !i.done);
  const suggestions = checklist.filter((i) => !i.done && !i.optional && !i.required);

  const Footer = ({ primary, onPrimary, skip, showExit = true }) => (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 mt-6 border-t border-gray-100">
      <div className="flex items-center gap-4 justify-center sm:justify-start">
        {step > 1 && (
          <button type="button" onClick={() => goTo(step - 1)} disabled={busy} className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        )}
        {showExit && (
          <button type="button" onClick={() => submitStep({ exit: true })} disabled={busy || preparing} className="text-sm font-bold text-gray-500 hover:text-gray-800">
            Save and finish later
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {skip && (
          <button type="button" onClick={skip} disabled={busy} className="px-5 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl">
            Skip for now
          </button>
        )}
        <button type="button" onClick={onPrimary} disabled={busy || preparing} className="flex items-center justify-center px-6 py-3.5 sm:py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
          {preparing ? 'Preparing image...' : busy ? 'Saving...' : primary}
          {!busy && !preparing && <ArrowRight className="w-4 h-4 ml-2" />}
        </button>
      </div>
    </div>
  );

  const UploadBar = () =>
    busy && progress > 0 && progress < 100 ? (
      <div className="mt-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#25D366] transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
      </div>
    ) : null;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header + completion indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-5 sm:mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 flex items-center">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[#128C7E] flex-shrink-0" /> Set up your store
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {setupComplete ? 'Everything is done. Nice work!' : `${prog.done} of ${prog.total} steps done. Your progress is saved automatically.`}
            </p>
          </div>
          <span className={`text-2xl sm:text-3xl font-black ${setupComplete ? 'text-emerald-600' : 'text-[#128C7E]'}`}>{prog.percent}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-[#25D366] rounded-full transition-all duration-500" style={{ width: `${prog.percent}%` }} />
        </div>
        {setupComplete && (
          <p className="mt-3 inline-flex items-center text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Setup complete
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[17rem_1fr] gap-5 sm:gap-6 items-start">
        {/* Checklist */}
        <aside className="lg:sticky lg:top-0">
          <button
            onClick={() => setShowList((v) => !v)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 mb-2"
          >
            <span className="flex items-center"><ListChecks className="w-4 h-4 mr-2 text-[#128C7E]" /> Checklist (step {step} of 6)</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showList ? 'rotate-180' : ''}`} />
          </button>
          <ul className={`${showList ? 'block' : 'hidden'} lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-2`}>
            {checklist.map((item) => {
              const locked = !store && item.step > 1;
              const active = item.step === step;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => goTo(item.step)}
                    disabled={locked}
                    className={`w-full flex items-center text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'bg-emerald-50 text-[#128C7E]' : 'text-gray-700 hover:bg-gray-50'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.done ? <CheckCircle2 className="w-5 h-5 mr-2.5 text-[#25D366] flex-shrink-0" /> : <Circle className="w-5 h-5 mr-2.5 text-gray-300 flex-shrink-0" />}
                    <span className={`flex-1 ${item.done ? 'text-gray-500' : ''}`}>{item.label}</span>
                    {item.optional && <span className="text-[10px] font-bold uppercase text-gray-400 ml-2">Optional</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Step content */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-8 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#128C7E]">Step {step} of {STEPS.length}</p>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{currentStep.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-5">{currentStep.hint}</p>

          {message.text && (
            <div role="status" className={`mb-5 p-3 sm:p-4 rounded-xl flex items-start border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
              <span className="text-sm font-medium break-words min-w-0">{message.text}</span>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="space-y-5">
                <Field id="name" label="Store name" hint="This is what customers see at the top of your store.">
                  <input id="name" type="text" required maxLength={80} autoComplete="organization" value={form.name} onChange={set('name')} className={inputClass} placeholder="e.g. My Gadget Hub" />
                </Field>
                <Field id="whatsapp" label="WhatsApp number for orders" hint="Customer orders will be sent to this number. We filled it in from your sign-up. Change it if needed.">
                  <input id="whatsapp" type="tel" inputMode="tel" autoComplete="tel" value={form.whatsappNumber} onChange={set('whatsappNumber')} className={inputClass} placeholder="08012345678" />
                </Field>
              </div>
              <UploadBar />
              <Footer primary="Save and continue" onPrimary={() => submitStep()} />
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="space-y-7">
                <ImagePicker round label="Brand logo" hint="Square works best, around 500 x 500." src={logoSrc} onPick={(e) => pickSingle(e, setLogo, 800)} />
                <ImagePicker label="Cover image" hint="A wide photo that shows what you sell." src={coverSrc} onPick={(e) => pickSingle(e, setCover, 1600)} />
              </div>
              <p className="text-xs text-gray-400 mt-4">Photos are shrunk automatically so they upload quickly. You can add these later.</p>
              <UploadBar />
              <Footer primary={logo.file || cover.file ? 'Save and continue' : 'Continue'} onPrimary={() => submitStep()} />
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div className="space-y-5">
                <Field id="description" label="Describe your business" hint={`${form.description.length}/500. Tell customers what you sell and what makes you different.`}>
                  <textarea id="description" rows="4" maxLength={500} value={form.description} onChange={set('description')} className={`${inputClass} resize-y`} placeholder="e.g. Quality sneakers and bags, delivered anywhere in Nigeria." />
                </Field>

                <Field id="type" label="Business category">
                  <select
                    id="type"
                    value={otherType ? 'Other' : form.businessType}
                    onChange={(e) => {
                      if (e.target.value === 'Other') { setOtherType(true); setForm((f) => ({ ...f, businessType: '' })); }
                      else { setOtherType(false); setForm((f) => ({ ...f, businessType: e.target.value })); }
                    }}
                    className={`${inputClass} bg-white`}
                  >
                    <option value="">Choose one</option>
                    {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {otherType && (
                    <input type="text" maxLength={60} value={form.businessType} onChange={set('businessType')} className={`${inputClass} mt-2`} placeholder="What kind of business is it?" aria-label="Your business category" />
                  )}
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field id="state" label="State">
                    <input id="state" type="text" list="ng-states" autoComplete="address-level1" value={form.state} onChange={set('state')} className={inputClass} placeholder="e.g. Oyo" />
                    <datalist id="ng-states">{NG_STATES.map((s) => <option key={s} value={s} />)}</datalist>
                  </Field>
                  <Field id="city" label="City or town">
                    <input id="city" type="text" autoComplete="address-level2" value={form.city} onChange={set('city')} className={inputClass} placeholder="e.g. Ibadan" />
                  </Field>
                </div>
                <Field id="address" label="Address (optional)" hint="Only add this if customers can visit or pick up.">
                  <input id="address" type="text" maxLength={200} autoComplete="street-address" value={form.address} onChange={set('address')} className={inputClass} />
                </Field>
              </div>
              <UploadBar />
              <Footer primary="Save and continue" onPrimary={() => submitStep()} />
            </>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <>
              <p className="text-sm text-gray-600 mb-4">Paste a link or just your username. Leave out anything you don't use.</p>
              <div className="space-y-4">
                {[
                  ['instagram', 'Instagram', '@yourbrand'],
                  ['facebook', 'Facebook', 'facebook.com/yourpage'],
                  ['tiktok', 'TikTok', '@yourbrand'],
                  ['twitter', 'X (Twitter)', '@yourbrand'],
                  ['website', 'Website', 'www.yourbrand.com'],
                ].map(([key, label, placeholder]) => (
                  <Field key={key} id={key} label={label}>
                    <input id={key} type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={form[key]} onChange={set(key)} className={inputClass} placeholder={placeholder} />
                  </Field>
                ))}
              </div>
              <Footer primary="Save and continue" onPrimary={() => submitStep()} skip={() => goTo(5)} />
            </>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <>
              {productCount > 0 && !addingAnother && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
                  <p className="flex items-center text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {justAdded ? 'Product added!' : `You already have ${productCount} product${productCount > 1 ? 's' : ''}.`}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {products.map((p) => (
                      <div key={p._id} className="flex items-center gap-2 bg-white rounded-lg border border-emerald-100 px-2 py-1.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 truncate max-w-[9rem]">{p.name}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setAddingAnother(true)} className="mt-3 inline-flex items-center text-sm font-bold text-[#128C7E]">
                    <Plus className="w-4 h-4 mr-1" /> Add another product
                  </button>
                </div>
              )}

              {showProductForm && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field id="p-name" label="Product name">
                      <input id="p-name" type="text" maxLength={120} value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className={inputClass} placeholder="e.g. Classic white sneakers" />
                    </Field>
                    <Field id="p-price" label="Price (₦)">
                      <input id="p-price" type="number" inputMode="decimal" min="0" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} className={inputClass} placeholder="15000" />
                    </Field>
                  </div>
                  <Field id="p-desc" label="Short description" hint="One line is enough, for example the size, colour or material.">
                    <textarea id="p-desc" rows="2" maxLength={1000} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} className={`${inputClass} resize-y`} />
                  </Field>
                  <Field id="p-cat" label="Product category (optional)" hint="Groups similar products together. Leave it blank to use your business category.">
                    <input id="p-cat" type="text" maxLength={50} value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} className={inputClass} placeholder={form.businessType || 'e.g. Shoes'} />
                  </Field>

                  <div>
                    <p className="block text-sm font-semibold text-gray-700 mb-1">Photos</p>
                    <div className="flex flex-wrap gap-3">
                      {productPreviews.map((src, index) => (
                        <div key={src} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {index === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">COVER</span>}
                          <button type="button" onClick={() => removeProductImage(index)} aria-label="Remove photo" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      {productFiles.length < 5 && (
                        <div className="relative w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#25D366]">
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px] font-semibold mt-0.5">Add</span>
                          <input type="file" multiple accept="image/*" aria-label="Add product photos" onChange={pickProductImages} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      )}
                    </div>
                    {productFiles.length === 0 ? (
                      <p className="text-xs text-amber-600 mt-2">Products with a photo get far more orders. You can add one later too.</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">{productFiles.length}/5 photos. The first is the cover.</p>
                    )}
                  </div>
                </div>
              )}

              <UploadBar />

              {showProductForm ? (
                <Footer primary="Add product" onPrimary={submitProduct} showExit={false} skip={productCount > 0 ? () => goTo(6) : undefined} />
              ) : (
                <Footer primary="Continue to preview" onPrimary={() => goTo(6)} showExit={false} />
              )}
            </>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <>
              {isPublished ? (
                <div className="text-center bg-emerald-50 border border-emerald-100 rounded-2xl p-5 sm:p-6 mb-5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="text-lg font-black text-gray-900">Your store is live!</h4>
                  <p className="text-sm text-gray-600 mt-1">Share your link so customers can start ordering on WhatsApp.</p>
                  <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl px-3 py-2 mt-4 text-left">
                    <span className="flex-1 min-w-0 text-sm font-mono text-gray-700 truncate">{storeUrl}</span>
                    <button onClick={() => copyLink(storeUrl)} className="flex-shrink-0 flex items-center text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-lg">
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1" /> Copied</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center mt-3">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Shop at ${store.businessName} on Vendira:\n${storeUrl}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center px-5 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold rounded-xl"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> Share on WhatsApp
                    </a>
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-5 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl">
                      <ExternalLink className="w-4 h-4 mr-2" /> View my store
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <p className="text-sm text-gray-600 mb-3">This is how customers will see your store. Check it, then publish.</p>
                  {blockers.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                      <p className="text-sm font-bold text-amber-800 mb-2">Before you can publish:</p>
                      <ul className="space-y-1.5">
                        {blockers.map((b) => (
                          <li key={b.key} className="flex items-center justify-between gap-3 text-sm text-amber-900">
                            <span>{b.label}</span>
                            <button onClick={() => goTo(b.step)} className="text-xs font-bold underline whitespace-nowrap">Fix this</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <StorePreview store={store} products={products} />

              {suggestions.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-5">
                  <p className="text-sm font-bold text-gray-700 mb-2">Recommended (you can do these after publishing):</p>
                  <ul className="space-y-1.5">
                    {suggestions.map((s) => (
                      <li key={s.key} className="flex items-center justify-between gap-3 text-sm text-gray-600">
                        <span className="flex items-center"><Circle className="w-3.5 h-3.5 mr-2 text-gray-300" /> {s.label}</span>
                        <button onClick={() => goTo(s.step)} className="text-xs font-bold text-[#128C7E] underline whitespace-nowrap">Add</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => goTo(5)} className="flex items-center justify-center sm:justify-start text-sm font-bold text-gray-500 hover:text-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
                {isPublished ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => publish(false)} disabled={busy} className="px-5 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl">Unpublish</button>
                    <Link to="/dashboard" className="flex items-center justify-center px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl">Go to dashboard</Link>
                  </div>
                ) : (
                  <button onClick={() => publish(true)} disabled={busy || !canPublish} className="flex items-center justify-center px-8 py-3.5 sm:py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    <Rocket className="w-4 h-4 mr-2" /> {busy ? 'Publishing...' : 'Publish my store'}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default StoreSetup;
