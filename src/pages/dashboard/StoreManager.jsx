import { useState, useEffect, useRef } from 'react';
import { Save, Store, AlertCircle, CheckCircle, Camera, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';

const MAX_IMAGE_MB = 5;

// text-base on phones stops iOS Safari zooming into focused inputs; text-sm from sm up
const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

const StoreManager = () => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    whatsappNumber: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const [hasStore, setHasStore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Track local preview URLs so they can be released
  const objectUrls = useRef([]);

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
          if (store.logo?.url) setLogoPreview(store.logo.url);
          if (store.coverImage?.url) setCoverPreview(store.coverImage.url);
          setHasStore(true);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching store:', error);
          setMessage({ type: 'error', text: 'Could not load your store details.' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyStore();

    return () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const pickImage = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      return showMessage('error', `That image is too large. Please choose one under ${MAX_IMAGE_MB}MB.`);
    }

    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setFile(file);
    setPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('slug', formData.slug.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('whatsappNumber', formData.whatsappNumber.trim());
    if (logoFile) submitData.append('logo', logoFile);
    if (coverFile) submitData.append('coverImage', coverFile);

    try {
      const res = hasStore
        ? await api.put('/stores/my-store', submitData)
        : await api.post('/stores', submitData);

      const saved = res.data?.data?.store;
      if (saved?.logo?.url) setLogoPreview(saved.logo.url);
      if (saved?.coverImage?.url) setCoverPreview(saved.coverImage.url);
      if (saved?.slug) setFormData((prev) => ({ ...prev, slug: saved.slug }));

      setLogoFile(null);
      setCoverFile(null);
      setHasStore(true);
      showMessage('success', hasStore ? 'Store updated successfully!' : 'Store created successfully!');
    } catch (error) {
      const serverMsg = error.response?.data?.error || error.response?.data?.message;
      showMessage(
        'error',
        serverMsg || (error.response ? 'Failed to save store details.' : 'Cannot reach the server. Check your connection.')
      );
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-3xl mx-auto md:mx-0 pb-8">
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
            {/* Hover overlay (desktop) */}
            <div className="absolute inset-0 bg-black/40 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            {/* Always-visible badge (touch devices have no hover) */}
            {coverPreview && (
              <span className="sm:hidden absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Change
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              aria-label="Upload store banner"
              onChange={(e) => pickImage(e, setCoverFile, setCoverPreview)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Wide images work best (for example 1500 x 500). Up to {MAX_IMAGE_MB}MB.</p>
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
                onChange={(e) => pickImage(e, setLogoFile, setLogoPreview)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {/* Badge sits outside the clipped circle and is always visible */}
            <span className="sm:hidden absolute -bottom-1 -right-1 bg-[#128C7E] text-white p-1.5 rounded-full shadow pointer-events-none">
              <Camera className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">Brand Logo</h3>
            <p className="text-sm text-gray-500 mt-1">Upload your business logo. Recommended size: 500x500px.</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WEBP. Up to {MAX_IMAGE_MB}MB.</p>
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
            {/* Stacked on phones so a long domain never squeezes the input; side by side from sm up */}
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

        <div className="pt-4 border-t border-gray-100 flex sm:justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 sm:py-3 bg-[#128C7E] text-white font-bold rounded-xl hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : hasStore ? 'Save Store Details' : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreManager;
