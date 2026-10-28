import { useState, useEffect, useRef } from 'react';
import {
  Package, Plus, Trash2, Image as ImageIcon, AlertCircle, CheckCircle,
  UploadCloud, Video, Tags, X, Pencil, Save, Store,
} from 'lucide-react';
import api from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import { formatMoney } from '../../utils/money';

const MAX_IMAGES = 5;
const MAX_PICK_MB = 15;
const UPLOAD_TIMEOUT_MS = 180000;

const EMPTY_FORM = { name: '', price: '', category: '', description: '', status: 'available' };
const EMPTY_ATTRS = [{ name: '', value: '' }];

const STATUS_OPTIONS = [
  { value: 'available', label: 'In stock' },
  { value: 'limited', label: 'Limited stock' },
  { value: 'out_of_stock', label: 'Out of stock (hidden from store)' },
  { value: 'hidden', label: 'Hidden from store' },
];

const STATUS_STYLES = {
  available: { label: 'In Stock', cls: 'bg-emerald-50 text-emerald-600' },
  limited: { label: 'Limited', cls: 'bg-amber-50 text-amber-600' },
  out_of_stock: { label: 'Out of stock', cls: 'bg-red-50 text-red-600' },
  sold_out: { label: 'Sold out', cls: 'bg-red-50 text-red-600' },
  hidden: { label: 'Hidden', cls: 'bg-gray-100 text-gray-600' },
};

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

const getCategoryName = (cat) => {
  if (!cat) return 'Uncategorized';
  if (typeof cat === 'object') return cat.name || 'Uncategorized';
  return cat;
};

const getCategoryId = (cat) => {
  if (!cat) return '';
  return typeof cat === 'object' ? cat._id || '' : cat;
};

// Shrinks a photo in the browser so uploads are fast on slow mobile data
const compressImage = (file, maxSide = 1400, quality = 0.82) =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return resolve(file);
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 300 * 1024) return resolve(file);

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

      const outType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: blob.type }));
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

const describeError = (error, fallback) => {
  if (error.response) {
    return error.response.data?.error || error.response.data?.message || `${fallback} (error ${error.response.status}).`;
  }
  if (error.code === 'ECONNABORTED') return 'The upload took too long and timed out. Try again on a stronger connection.';
  return 'Could not reach the server. It may be waking up (this can take up to a minute). Please try again.';
};

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currency, setCurrency] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [noStore, setNoStore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [attributes, setAttributes] = useState(EMPTY_ATTRS);

  // Media: photos already saved on the product, plus new ones picked in this session
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingVideo, setExistingVideo] = useState(null);
  const [keepVideo, setKeepVideo] = useState(true);
  const [videoFile, setVideoFile] = useState(null);

  const formRef = useRef(null);
  const previewUrls = useRef([]);

  const isEditing = Boolean(editingId);
  const money = (amount) => formatMoney(amount, currency);

  const fetchInitialData = async () => {
    const [productsRes, categoriesRes, storeRes] = await Promise.allSettled([
      api.get('/products'),
      api.get('/categories'),
      api.get('/stores/my-store'),
    ]);

    // A 404 here means the vendor has no store yet
    const noStoreYet = [categoriesRes, storeRes].some(
      (r) => r.status === 'rejected' && r.reason?.response?.status === 404
    );
    if (noStoreYet) setNoStore(true);

    if (productsRes.status === 'fulfilled') {
      setProducts(productsRes.value.data?.data?.products || []);
    }
    if (categoriesRes.status === 'fulfilled') {
      setCategories(categoriesRes.value.data?.data || []);
    }
    if (storeRes.status === 'fulfilled') {
      setCurrency(storeRes.value.data?.data?.store?.currency || 'NGN');
    }

    // Report real failures only. A missing store is handled by the empty state below.
    const failed = [productsRes, categoriesRes, storeRes].find(
      (r) => r.status === 'rejected' && r.reason?.response?.status !== 404
    );
    if (failed) {
      console.error('Error fetching data:', failed.reason?.response?.status, failed.reason?.response?.data);
      setMessage({
        type: 'error',
        text: failed.reason?.response?.data?.error || 'Could not load some of your store data.',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
    return () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // The dashboard scrolls inside its own container, so scroll both it and the window
  const showMessage = (type, text) => {
    setMessage({ type, text });
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearNewMedia = () => {
    imagePreviews.forEach((src) => URL.revokeObjectURL(src));
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
  };

  const resetForm = () => {
    clearNewMedia();
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setAttributes(EMPTY_ATTRS);
    setExistingImages([]);
    setExistingVideo(null);
    setKeepVideo(true);
  };

  const startEdit = (product) => {
    clearNewMedia();
    setMessage({ type: '', text: '' });
    setEditingId(product._id);
    setFormData({
      name: product.name || '',
      price: String(product.price ?? ''),
      category: getCategoryId(product.category),
      description: product.description || '',
      status: STATUS_OPTIONS.some((s) => s.value === product.status) ? product.status : 'available',
    });
    setAttributes(
      product.attributes?.length
        ? product.attributes.map((a) => ({
            name: a.name || '',
            value: Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? ''),
          }))
        : EMPTY_ATTRS
    );
    setExistingImages(product.images || []);
    setExistingVideo(product.video?.url ? product.video : null);
    setKeepVideo(true);

    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAttributeChange = (index, field, value) =>
    setAttributes((prev) => prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)));
  const addAttribute = () => setAttributes((prev) => [...prev, { name: '', value: '' }]);
  const removeAttribute = (index) => setAttributes((prev) => prev.filter((_, i) => i !== index));

  const totalImages = existingImages.length + imageFiles.length;

  const handleImageChange = async (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = '';
    if (picked.length === 0) return;

    const room = MAX_IMAGES - totalImages;
    if (room <= 0) return showMessage('error', `You can have up to ${MAX_IMAGES} photos per product.`);

    const chosen = picked.slice(0, room);
    if (picked.length > room) showMessage('error', `Only ${MAX_IMAGES} photos are allowed, so extra ones were skipped.`);

    const tooBig = chosen.find((f) => f.size > MAX_PICK_MB * 1024 * 1024);
    if (tooBig) return showMessage('error', `"${tooBig.name}" is too large. Please choose photos under ${MAX_PICK_MB}MB.`);

    setPreparing(true);
    const files = await Promise.all(chosen.map((f) => compressImage(f)));
    setPreparing(false);

    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrls.current.push(...urls);
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...urls]);
  };

  const removeExistingImage = (publicId) =>
    setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId));

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((files) => files.filter((_, i) => i !== index));
    setImagePreviews((previews) => previews.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return showMessage('error', 'That video is too large. Please choose one under 50MB.');
    setVideoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (preparing) return;
    setSubmitting(true);
    setProgress(0);
    setMessage({ type: '', text: '' });

    const body = new FormData();
    body.append('name', formData.name.trim());
    body.append('price', formData.price);
    body.append('category', formData.category);
    body.append('description', formData.description.trim());

    const validAttributes = attributes
      .map((attr) => ({ name: attr.name.trim(), value: attr.value.trim() }))
      .filter((attr) => attr.name && attr.value);
    body.append('attributes', JSON.stringify(validAttributes));

    imageFiles.forEach((file) => body.append('images', file));
    if (videoFile) body.append('video', videoFile);

    if (isEditing) {
      const original = products.find((p) => p._id === editingId);
      const removedImageIds = (original?.images || [])
        .filter((img) => !existingImages.some((kept) => kept.public_id === img.public_id))
        .map((img) => img.public_id);

      body.append('status', formData.status);
      body.append('removeImages', JSON.stringify(removedImageIds));
      if (original?.video?.url && !keepVideo && !videoFile) body.append('removeVideo', 'true');
    }

    const config = {
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: (ev) => {
        if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
      },
    };

    try {
      if (isEditing) {
        const res = await api.put(`/products/${editingId}`, body, config);
        const updated = res.data?.data?.product;
        if (updated) setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        else fetchInitialData();
        showMessage('success', 'Product updated successfully!');
      } else {
        await api.post('/products', body, config);
        fetchInitialData();
        showMessage('success', 'Product added successfully!');
      }
      resetForm();
    } catch (error) {
      console.error('Save product failed:', error.response?.status, error.response?.data, error.code);
      showMessage('error', describeError(error, isEditing ? 'Failed to update product' : 'Failed to add product'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      if (editingId === product._id) resetForm();
    } catch (error) {
      showMessage('error', describeError(error, 'Failed to delete product'));
    }
  };

  const noPhotos = totalImages === 0;

  // Vendors without a store are sent to setup instead of seeing a broken form
  if (noStore) {
    return (
      <EmptyState
        icon={Store}
        title="Set up your store first"
        description="Products live inside your store. It only takes a few minutes, and your progress is saved as you go."
        actionLabel="Set up my store"
        to="/dashboard/setup"
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Package className="w-6 h-6 mr-2 text-[#128C7E] flex-shrink-0" /> Product Catalogue
        </h2>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Upload photos, videos, and set custom variations for your inventory.
        </p>
      </div>

      {message.text && (
        <div
          role="status"
          className={`p-3 sm:p-4 rounded-xl flex items-start ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
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

      {/* ADD / EDIT FORM */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`bg-white rounded-2xl shadow-sm border overflow-hidden scroll-mt-4 ${
          isEditing ? 'border-[#25D366] ring-2 ring-[#25D366]/20' : 'border-gray-100'
        }`}
      >
        <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center min-w-0">
              {isEditing ? (
                <><Pencil className="w-5 h-5 mr-2 text-[#128C7E] flex-shrink-0" /> <span className="truncate">Edit Product</span></>
              ) : (
                <><Plus className="w-5 h-5 mr-2 text-[#25D366] flex-shrink-0" /> Add New Product</>
              )}
            </h3>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-bold text-gray-500 hover:text-gray-800 flex-shrink-0"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
              <input id="name" type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="e.g. Designer Sneakers" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-1">{`Base Price (${currency})`}</label>
              <input id="price" type="number" inputMode="decimal" name="price" required min="0" value={formData.price} onChange={handleChange} className={inputClass} placeholder="15000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              {categories.length === 0 ? (
                <div className="p-3 bg-orange-50 text-orange-700 text-sm rounded-xl border border-orange-100">
                  You haven't created any categories yet. Go to the <strong>Categories</strong> tab to create one first.
                </div>
              ) : (
                <select id="category" name="category" required value={formData.category} onChange={handleChange} className={`${inputClass} bg-white`}>
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              )}
              {isEditing && !formData.category && categories.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">This product has no valid category. Please pick one.</p>
              )}
            </div>

            {isEditing && (
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className={`${inputClass} bg-white`}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Variations */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-800 flex items-center">
                <Tags className="w-4 h-4 mr-2 text-[#128C7E]" /> Product Variations
              </span>
              <button type="button" onClick={addAttribute} className="text-sm text-[#128C7E] font-bold hover:text-[#075E54]">
                + Add Variation
              </button>
            </div>
            <div className="space-y-3">
              {attributes.map((attr, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                  <input type="text" placeholder="e.g. Size, Color, RAM" aria-label="Variation name" value={attr.name} onChange={(e) => handleAttributeChange(index, 'name', e.target.value)} className={`${inputClass} sm:w-1/3`} />
                  <input type="text" placeholder="e.g. S, M, L or 4GB, 8GB" aria-label="Variation options" value={attr.value} onChange={(e) => handleAttributeChange(index, 'value', e.target.value)} className={`${inputClass} sm:flex-1`} />
                  {attributes.length > 1 && (
                    <button type="button" onClick={() => removeAttribute(index)} aria-label="Remove variation" className="self-end sm:self-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Separate options with commas, for example "S, M, L". Customers pick one when they order.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea id="description" name="description" rows="3" required value={formData.description} onChange={handleChange} className={`${inputClass} resize-y`} placeholder="Brief product details..." />
          </div>

          {/* Media */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Product Media</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 sm:p-6 text-center hover:bg-gray-50 transition-colors relative">
                <input type="file" multiple accept="image/*" aria-label="Add photos" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-8 h-8 text-[#128C7E] mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Add Photos</p>
                <p className="text-xs text-gray-400 mt-1">{totalImages}/{MAX_IMAGES} photos. The first one is the cover image.</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 sm:p-6 text-center hover:bg-gray-50 transition-colors relative">
                <input type="file" accept="video/*" aria-label="Add a video" onChange={handleVideoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Video className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">
                  {existingVideo || videoFile ? 'Replace video' : 'Add a Video'} <span className="font-normal text-gray-400">(Optional)</span>
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {videoFile ? videoFile.name : existingVideo && keepVideo ? 'Current video kept' : 'Showcase your product in action'}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {videoFile && (
                <button type="button" onClick={() => setVideoFile(null)} className="text-xs text-red-500 font-semibold hover:text-red-700">
                  Remove new video
                </button>
              )}
              {existingVideo && !videoFile && (
                keepVideo ? (
                  <button type="button" onClick={() => setKeepVideo(false)} className="text-xs text-red-500 font-semibold hover:text-red-700">
                    Remove current video
                  </button>
                ) : (
                  <button type="button" onClick={() => setKeepVideo(true)} className="text-xs text-[#128C7E] font-semibold hover:text-[#075E54]">
                    Keep current video
                  </button>
                )
              )}
            </div>

            {(existingImages.length > 0 || imagePreviews.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {existingImages.map((img, index) => (
                  <div key={img.public_id || img.url} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <img src={img.url} alt="Saved photo" className="w-full h-full object-cover" />
                    {index === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">COVER</span>}
                    <button type="button" onClick={() => removeExistingImage(img.public_id)} aria-label="Remove photo" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md text-red-500 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {imagePreviews.map((src, index) => (
                  <div key={src} className="relative w-20 h-20 rounded-lg border-2 border-[#25D366] overflow-hidden shadow-sm">
                    <img src={src} alt="New photo" className="w-full h-full object-cover" />
                    {existingImages.length === 0 && index === 0 ? (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">COVER</span>
                    ) : (
                      <span className="absolute bottom-0 inset-x-0 bg-[#25D366] text-white text-[9px] font-bold text-center py-0.5">NEW</span>
                    )}
                    <button type="button" onClick={() => removeNewImage(index)} aria-label="Remove new photo" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md text-red-500 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {noPhotos && isEditing && (
              <p className="text-xs text-amber-600 mt-2">This product will have no photos. Products with photos sell better.</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-100 space-y-3">
          {submitting && (imageFiles.length > 0 || videoFile) && (
            <div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#25D366] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Uploading media... {progress}%</p>
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {isEditing && (
              <button type="button" onClick={resetForm} disabled={submitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-60">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || preparing || categories.length === 0}
              className="px-8 py-3.5 sm:py-3 bg-[#128C7E] text-white font-bold rounded-xl hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
            >
              {isEditing ? <Save className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-1" />}
              {preparing ? 'Preparing photos...' : submitting ? (isEditing ? 'Saving...' : 'Uploading...') : isEditing ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </div>
      </form>

      {/* INVENTORY */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-5 sm:mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <span>Your Inventory</span>
          <span className="bg-emerald-100 text-[#128C7E] text-sm px-3 py-1 rounded-full">{products.length} Items</span>
        </h3>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50 px-4">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No products added yet.</p>
            <p className="text-sm mt-1">Use the form above to add your first item to the store!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((p) => {
              const status = STATUS_STYLES[p.status] || { label: 'Unavailable', cls: 'bg-red-50 text-red-600' };
              const beingEdited = p._id === editingId;
              return (
                <div
                  key={p._id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between shadow-sm bg-white hover:shadow-md transition-shadow min-w-0 ${
                    beingEdited ? 'border-[#25D366] ring-2 ring-[#25D366]/30' : 'border-gray-100'
                  }`}
                >
                  <div>
                    <div className="h-44 sm:h-48 bg-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-gray-50 relative">
                      {p.images?.length > 0 ? (
                        <img src={p.images[0].url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      )}
                      {p.video?.url && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-lg backdrop-blur-sm">
                          <Video className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 truncate" title={p.name}>{p.name}</h4>
                    <p className="text-[#128C7E] font-black mt-1 text-lg">{money(p.price)}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-semibold truncate max-w-full">
                        {getCategoryName(p.category)}
                      </span>
                      {p.attributes?.map((attr, idx) => (
                        <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md font-semibold truncate max-w-full">
                          {attr.name}: {Array.isArray(attr.value) ? attr.value.join(', ') : String(attr.value)}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      {p.views || 0} views · {p.whatsappClicks || 0} WhatsApp taps
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${status.cls}`}>{status.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(p)}
                        aria-label={`Edit ${p.name}`}
                        className="flex items-center text-sm font-bold text-[#128C7E] hover:bg-emerald-50 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4 mr-1.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        aria-label={`Delete ${p.name}`}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
