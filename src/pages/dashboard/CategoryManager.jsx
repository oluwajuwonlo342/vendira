import { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  
  // Message State
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
        showMessage('success', 'Category updated successfully!');
      } else {
        await api.post('/categories', formData);
        showMessage('success', 'Category created successfully!');
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in this category might be affected.')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      showMessage('success', 'Category deleted.');
      fetchCategories();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to delete category.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-8"></div>
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl w-full"></div>)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Manage Categories</h1>
          <p className="text-gray-500 mt-1">Organize your products into custom collections.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', description: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center px-4 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold rounded-xl shadow-sm transition-colors"
        >
          {showForm ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Category</>}
        </button>
      </div>

      {/* Global Feedback Message */}
      {message.text && (
        <div className={`p-4 mb-6 rounded-xl flex items-center shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Tags className="w-5 h-5 mr-2 text-[#128C7E]" />
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Category Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Sneakers, Summer Collection"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (Optional)</label>
              <textarea 
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all text-sm resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-sm text-sm transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tags className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No categories yet</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">Create categories to help your customers easily filter and find products on your storefront.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((category) => (
              <li key={category._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                  <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">/{category.slug}</span>
                    {category.description && <span>{category.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(category._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;