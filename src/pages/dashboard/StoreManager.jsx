import { useState, useEffect } from 'react';
import { Save, Store, AlertCircle, CheckCircle, Camera, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';

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

  useEffect(() => {
    const fetchMyStore = async () => {
      try {
        const response = await api.get('/stores/my-store');
        if (response.data?.data?.store) {
          const store = response.data.data.store;
          setFormData({
            name: store.name || store.businessName || '',
            slug: store.slug || '',
            description: store.description || '',
            whatsappNumber: store.whatsappNumber || ''
          });
          
          if (store.logo?.url) setLogoPreview(store.logo.url);
          if (store.coverImage?.url) setCoverPreview(store.coverImage.url);
          
          setHasStore(true);
        }
      } catch (error) {
        if (error.response?.status !== 404) console.error("Error fetching store:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyStore();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('slug', formData.slug);
    submitData.append('description', formData.description);
    submitData.append('whatsappNumber', formData.whatsappNumber);
    if (logoFile) submitData.append('logo', logoFile);
    if (coverFile) submitData.append('coverImage', coverFile);

    try {
      if (hasStore) {
        const res = await api.put('/stores/my-store', submitData);
        if (res.data?.data?.store?.logo?.url) setLogoPreview(res.data.data.store.logo.url);
        if (res.data?.data?.store?.coverImage?.url) setCoverPreview(res.data.data.store.coverImage.url);
        setMessage({ type: 'success', text: 'Store updated successfully!' });
      } else {
        const res = await api.post('/stores', submitData);
        setHasStore(true);
        if (res.data?.data?.store?.logo?.url) setLogoPreview(res.data.data.store.logo.url);
        if (res.data?.data?.store?.coverImage?.url) setCoverPreview(res.data.data.store.coverImage.url);
        setMessage({ type: 'success', text: 'Store created successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save store details.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 font-medium">Loading store profile...</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Store className="w-6 h-6 mr-2 text-[#128C7E]" />
          Store Settings
        </h2>
        <p className="text-gray-500 mt-1">Configure how customers see your brand and where your orders are sent.</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-start ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
        
        {/* Cover Image Upload */}
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Store Banner (Cover Image)</h3>
          <div className="relative w-full h-40 sm:h-48 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden group cursor-pointer hover:border-[#25D366] transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">Click to upload banner (Optional)</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden group cursor-pointer hover:border-[#25D366] transition-colors">
            {logoPreview ? (
              <img src={logoPreview} alt="Store Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Brand Logo</h3>
            <p className="text-sm text-gray-500 mt-1">Upload your business logo. Recommended size: 500x500px.</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WEBP.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#25D366]" placeholder="e.g. My Gadget Hub" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Store URL (Slug)</label>
            <div className="flex rounded-xl shadow-sm overflow-hidden">
              <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 text-gray-500 sm:text-sm">{window.location.host}/store/</span>
              <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="flex-1 min-w-0 block w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-[#25D366]" placeholder="my-gadget-hub" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number for Orders</label>
          <input type="tel" name="whatsappNumber" required value={formData.whatsappNumber} onChange={handleChange} className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#25D366]" placeholder="08012345678" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Store Description</label>
          <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#25D366]" placeholder="What do you sell? This appears on your storefront header." />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center px-6 py-3 bg-[#128C7E] text-white font-bold rounded-xl hover:bg-[#075E54] focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70">
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Store Details'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreManager;