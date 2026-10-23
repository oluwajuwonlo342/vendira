import { useState, useEffect } from 'react'; 
import { Package, Plus, Trash2, Image as ImageIcon, AlertCircle, CheckCircle, UploadCloud, Video, Tags, X } from 'lucide-react'; 
import api from '../../api/axios'; 

const MAX_IMAGES = 5; 

// Safe for populated objects, plain strings, and null
const getCategoryName = (cat) => { 
  if (!cat) return 'Uncategorized'; 
  if (typeof cat === 'object') return cat.name || 'Uncategorized'; 
  return cat; 
}; 

const formatPrice = (price) => `₦${Number(price || 0).toLocaleString()}`; 

const STATUS_STYLES = { 
  available: { label: 'In Stock', cls: 'bg-emerald-50 text-emerald-600' }, 
  limited: { label: 'Limited', cls: 'bg-amber-50 text-amber-600' }, 
}; 

const ProductManager = () => { 
  const [products, setProducts] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [submitting, setSubmitting] = useState(false); 
  const [message, setMessage] = useState({ type: '', text: '' }); 
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    category: '', // Changed to empty string to hold the category _id
    description: '', 
  }); 

  // Dynamic variations
  const [attributes, setAttributes] = useState([{ name: '', value: '' }]); 
  
  // Media 
  const [imageFiles, setImageFiles] = useState([]); 
  const [videoFile, setVideoFile] = useState(null); 
  const [imagePreviews, setImagePreviews] = useState([]); 

  const fetchInitialData = async () => { 
    try { 
      // Fetch both products and the vendor's custom categories simultaneously
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(productsRes.data?.data?.products || productsRes.data?.data || []); 
      setCategories(categoriesRes.data?.data || []);
    } catch (error) { 
      console.error('Error fetching data:', error); 
      setMessage({ type: 'error', text: 'Could not load your store data.' }); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  useEffect(() => { 
    fetchInitialData(); 
  }, []); 

  useEffect(() => { 
    return () => imagePreviews.forEach((src) => URL.revokeObjectURL(src)); 
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

  const showMessage = (type, text) => { 
    setMessage({ type, text }); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }; 

  const handleChange = (e) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value }); 
  }; 

  const handleAttributeChange = (index, field, value) => { 
    setAttributes((prev) => prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr))); 
  }; 
  
  const addAttribute = () => setAttributes((prev) => [...prev, { name: '', value: '' }]); 
  const removeAttribute = (index) => setAttributes((prev) => prev.filter((_, i) => i !== index)); 

  const handleImageChange = (e) => { 
    const picked = Array.from(e.target.files); 
    e.target.value = ''; 
    const room = MAX_IMAGES - imageFiles.length; 
    
    if (room <= 0) { 
      return showMessage('error', `You can upload up to ${MAX_IMAGES} photos per product.`); 
    } 
    
    const files = picked.slice(0, room); 
    if (picked.length > room) { 
      showMessage('error', `Only ${MAX_IMAGES} photos are allowed, extra ones were skipped.`); 
    } 
    
    setImageFiles((prev) => [...prev, ...files]); 
    setImagePreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]); 
  }; 

  const removeImage = (index) => { 
    URL.revokeObjectURL(imagePreviews[index]); 
    setImageFiles((files) => files.filter((_, i) => i !== index)); 
    setImagePreviews((previews) => previews.filter((_, i) => i !== index)); 
  }; 

  const handleVideoChange = (e) => { 
    if (e.target.files[0]) setVideoFile(e.target.files[0]); 
    e.target.value = ''; 
  }; 

  const handleAddProduct = async (e) => { 
    e.preventDefault(); 
    setSubmitting(true); 
    setMessage({ type: '', text: '' }); 

    const submitData = new FormData(); 
    submitData.append('name', formData.name.trim()); 
    submitData.append('price', formData.price); 
    submitData.append('category', formData.category); // Sends the Category ObjectId
    submitData.append('description', formData.description.trim()); 
    
    const validAttributes = attributes 
      .map((attr) => ({ name: attr.name.trim(), value: attr.value.trim() })) 
      .filter((attr) => attr.name && attr.value); 
      
    submitData.append('attributes', JSON.stringify(validAttributes)); 
    imageFiles.forEach((file) => submitData.append('images', file)); 
    if (videoFile) submitData.append('video', videoFile); 

    try { 
      await api.post('/products', submitData); 
      showMessage('success', 'Product added successfully!'); 
      imagePreviews.forEach((src) => URL.revokeObjectURL(src)); 
      setFormData({ name: '', price: '', category: '', description: '' }); 
      setAttributes([{ name: '', value: '' }]); 
      setImageFiles([]); 
      setImagePreviews([]); 
      setVideoFile(null); 
      fetchInitialData(); 
    } catch (error) { 
      console.error('Add product failed:', error.response?.status, error.response?.data); 
      const serverMsg = error.response?.data?.error || error.response?.data?.message; 
      showMessage('error', serverMsg || 'Failed to add product.'); 
    } finally { 
      setSubmitting(false); 
    } 
  }; 

  const handleDelete = async (id) => { 
    if (!window.confirm('Are you sure you want to delete this product?')) return; 
    try { 
      await api.delete(`/products/${id}`); 
      setProducts((prev) => prev.filter((p) => p._id !== id)); 
    } catch (error) { 
      showMessage('error', error.response?.data?.error || 'Failed to delete product.'); 
    } 
  }; 

  return ( 
    <div className="max-w-5xl mx-auto space-y-8 pb-12"> 
      <div> 
        <h2 className="text-2xl font-bold text-gray-900 flex items-center"> 
          <Package className="w-6 h-6 mr-2 text-[#128C7E]" /> Product Catalogue 
        </h2> 
        <p className="text-gray-500 mt-1">Upload photos, videos, and set custom variations for your inventory.</p> 
      </div> 

      {message.text && ( 
        <div role="status" className={`p-4 rounded-xl flex items-start ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}> 
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />} 
          <span className="text-sm font-medium">{message.text}</span> 
        </div> 
      )} 

      <form onSubmit={handleAddProduct} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"> 
        <div className="p-6 sm:p-8 space-y-6"> 
          <h3 className="text-lg font-bold text-gray-800 flex items-center border-b border-gray-100 pb-4"> 
            <Plus className="w-5 h-5 mr-2 text-[#25D366]" /> Add New Product 
          </h3> 

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
            <div> 
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label> 
              <input 
                type="text" name="name" required 
                value={formData.name} onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors" 
                placeholder="e.g. Designer Sneakers" 
              /> 
            </div> 
            <div> 
              <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price (₦)</label> 
              <input 
                type="number" name="price" required min="0" 
                value={formData.price} onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors" 
                placeholder="15000" 
              /> 
            </div> 
          </div> 

          {/* DYNAMIC CATEGORY DROPDOWN */}
          <div> 
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label> 
            {categories.length === 0 ? (
              <div className="p-3 bg-orange-50 text-orange-700 text-sm rounded-xl border border-orange-100">
                You haven't created any categories yet. Please go to the <strong>Categories</strong> tab to create one first.
              </div>
            ) : (
              <select 
                name="category" required 
                value={formData.category} onChange={handleChange} 
                className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors bg-white"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">Products with the same category are grouped together on your storefront.</p> 
          </div> 

          <div className="pt-4 border-t border-gray-100"> 
            <div className="flex justify-between items-center mb-3"> 
              <label className="block text-sm font-bold text-gray-800 flex items-center"> 
                <Tags className="w-4 h-4 mr-2 text-[#128C7E]" /> Product Variations 
              </label> 
              <button type="button" onClick={addAttribute} className="text-sm text-[#128C7E] font-bold hover:text-[#075E54]"> 
                + Add Variation 
              </button> 
            </div> 
            <div className="space-y-3"> 
              {attributes.map((attr, index) => ( 
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"> 
                  <input 
                    type="text" placeholder="e.g. Size, Color, RAM" 
                    value={attr.name} onChange={(e) => handleAttributeChange(index, 'name', e.target.value)} 
                    className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366]" 
                  /> 
                  <input 
                    type="text" placeholder="e.g. S, M, L or 4GB, 8GB" 
                    value={attr.value} onChange={(e) => handleAttributeChange(index, 'value', e.target.value)} 
                    className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366]" 
                  /> 
                  {attributes.length > 1 && ( 
                    <button type="button" onClick={() => removeAttribute(index)} aria-label="Remove variation" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"> 
                      <Trash2 className="w-5 h-5" /> 
                    </button> 
                  )} 
                </div> 
              ))} 
            </div> 
            <p className="text-xs text-gray-500 mt-2">Separate options with commas, for example "S, M, L". Customers pick one when they order.</p> 
          </div> 

          <div> 
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label> 
            <textarea 
              name="description" rows="3" required 
              value={formData.description} onChange={handleChange} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors" 
              placeholder="Brief product details..." 
            /> 
          </div> 

          <div className="pt-4 border-t border-gray-100"> 
            <h4 className="text-sm font-bold text-gray-800 mb-3">Product Media</h4> 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative"> 
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /> 
                <UploadCloud className="w-8 h-8 text-[#128C7E] mx-auto mb-2" /> 
                <p className="text-sm font-semibold text-gray-700">Add Photos</p> 
                <p className="text-xs text-gray-400 mt-1">{imageFiles.length}/{MAX_IMAGES} added. The first photo is the cover image.</p> 
              </div> 
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative"> 
                <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /> 
                <Video className="w-8 h-8 text-blue-500 mx-auto mb-2" /> 
                <p className="text-sm font-semibold text-gray-700">Add a Video <span className="font-normal text-gray-400">(Optional)</span></p> 
                <p className="text-xs text-gray-400 mt-1">{videoFile ? videoFile.name : 'Showcase your product in action'}</p> 
              </div> 
            </div> 

            {videoFile && ( 
              <button type="button" onClick={() => setVideoFile(null)} className="mt-2 text-xs text-red-500 font-semibold hover:text-red-700"> 
                Remove video 
              </button> 
            )} 

            {imagePreviews.length > 0 && ( 
              <div className="mt-4 flex flex-wrap gap-3"> 
                {imagePreviews.map((src, index) => ( 
                  <div key={src} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden shadow-sm"> 
                    <img src={src} alt="Preview" className="w-full h-full object-cover" /> 
                    {index === 0 && ( 
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">COVER</span> 
                    )} 
                    <button type="button" onClick={() => removeImage(index)} aria-label="Remove photo" className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-md text-red-500 hover:text-red-700"> 
                      <X className="w-3 h-3" /> 
                    </button> 
                  </div> 
                ))} 
              </div> 
            )} 
          </div> 
        </div> 

        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100"> 
          <button 
            type="submit" 
            disabled={submitting || categories.length === 0} 
            className="px-8 py-3 bg-[#128C7E] text-white font-bold rounded-xl hover:bg-[#075E54] focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 flex items-center shadow-sm"
          > 
            <Plus className="w-5 h-5 mr-1" /> {submitting ? 'Uploading...' : 'Publish Product'} 
          </button> 
        </div> 
      </form> 

      {/* Inventory Display */} 
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"> 
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center justify-between border-b border-gray-100 pb-4"> 
          <span>Your Inventory</span> 
          <span className="bg-emerald-100 text-[#128C7E] text-sm px-3 py-1 rounded-full">{products.length} Items</span> 
        </h3> 

        {loading ? ( 
          <div className="animate-pulse space-y-4"> 
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div> 
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div> 
          </div> 
        ) : products.length === 0 ? ( 
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50"> 
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" /> 
            <p className="font-medium text-gray-500">No products added yet.</p> 
            <p className="text-sm mt-1">Use the form above to add your first item to the store!</p> 
          </div> 
        ) : ( 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> 
            {products.map((p) => { 
              const status = STATUS_STYLES[p.status] || { label: 'Unavailable', cls: 'bg-red-50 text-red-600' }; 
              return ( 
                <div key={p._id} className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm bg-white hover:shadow-md transition-shadow"> 
                  <div> 
                    <div className="h-48 bg-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-gray-50 relative"> 
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
                    <p className="text-[#128C7E] font-black mt-1 text-lg">{formatPrice(p.price)}</p> 
                    <div className="flex flex-wrap gap-2 mt-3"> 
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-semibold truncate max-w-full"> 
                        {getCategoryName(p.category)} 
                      </span> 
                      {p.attributes?.map((attr, idx) => ( 
                        <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md font-semibold truncate"> 
                          {attr.name}: {Array.isArray(attr.value) ? attr.value.join(', ') : String(attr.value)} 
                        </span> 
                      ))} 
                    </div> 
                    <p className="text-xs text-gray-400 mt-3"> 
                      {p.views || 0} views · {p.whatsappClicks || 0} WhatsApp clicks 
                    </p> 
                  </div> 
                  <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center"> 
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${status.cls}`}>{status.label}</span> 
                    <button onClick={() => handleDelete(p._id)} aria-label={`Delete ${p.name}`} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"> 
                      <Trash2 className="w-4 h-4" /> 
                    </button> 
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