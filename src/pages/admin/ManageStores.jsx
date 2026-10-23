import { useState, useEffect } from 'react';
import { Store, Search, ExternalLink, AlertCircle, CheckCircle, Package } from 'lucide-react';
import api from '../../api/axios';

const ManageStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get('/admin/stores');
        // Accept { data: [...] } or { data: { stores: [...] } }
        const payload = res.data?.data;
        setStores(Array.isArray(payload) ? payload : payload?.stores || []);
      } catch (err) {
        console.error('Load stores failed:', err.response?.status, err.response?.data);
        const status = err.response?.status;
        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          (status ? `Failed to load stores (${status}).` : 'Cannot reach the server.')
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Works whether the API returns the owner as "vendor" or "user", populated or not
  const getOwner = (store) => {
    const owner = store.vendor || store.user;
    return owner && typeof owner === 'object' ? owner : null;
  };

  const getName = (store) => store.businessName || store.name || 'Unnamed store';

  const term = searchTerm.trim().toLowerCase();
  const filteredStores = stores.filter((store) => {
    if (!term) return true;
    const owner = getOwner(store);
    return (
      getName(store).toLowerCase().includes(term) ||
      store.slug?.toLowerCase().includes(term) ||
      owner?.name?.toLowerCase().includes(term) ||
      owner?.email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="h-96 bg-slate-200 rounded-3xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Platform Stores</h2>
          <p className="text-slate-500 mt-1">
            Monitor all vendor storefronts created on Vendira. {stores.length > 0 && `(${stores.length} total)`}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by store, slug or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stores Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredStores.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold">
              {error
                ? 'Stores could not be loaded.'
                : stores.length === 0
                  ? 'No stores have been created yet.'
                  : 'No stores match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Store Brand</th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">Vendor Owner</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStores.map((store) => {
                  const owner = getOwner(store);
                  const isActive = !store.status || store.status === 'active';
                  return (
                    <tr key={store._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {store.logo?.url ? (
                              <img src={store.logo.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {getName(store)}
                              {store.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" title="Verified" />}
                            </div>
                            <div className={`text-xs font-semibold px-2 py-0.5 rounded mt-1 inline-block capitalize ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                              {store.status || 'active'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">/{store.slug}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700">{owner?.name || 'Unknown Vendor'}</div>
                        <div className="text-xs text-slate-500">{owner?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-bold text-slate-700">
                          <Package className="w-4 h-4 mr-1.5 text-slate-400" /> {store.productCount ?? '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/store/${store.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                          title="Visit Live Store"
                        >
                          Visit <ExternalLink className="w-3 h-3 ml-1.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStores;