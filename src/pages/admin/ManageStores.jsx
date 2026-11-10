import { useState, useEffect, useMemo, useCallback } from 'react';
import { Store, Search, ExternalLink, AlertCircle, CheckCircle, Package } from 'lucide-react';
import api from '../../api/axios';

const STATE_STYLES = {
  live: { label: 'Live', cls: 'text-emerald-700 bg-emerald-50' },
  draft: { label: 'Draft', cls: 'text-amber-700 bg-amber-50' },
  suspended: { label: 'Suspended', cls: 'text-red-700 bg-red-50' },
  banned: { label: 'Banned', cls: 'text-red-700 bg-red-50' },
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'draft', label: 'Drafts' },
  { value: 'blocked', label: 'Suspended or banned' },
];

// A store is a draft until its vendor publishes it, and customers can't see drafts
const getState = (store) => {
  if (store.status === 'banned') return 'banned';
  if (store.status === 'suspended') return 'suspended';
  if (store.isPublished === false) return 'draft';
  return 'live';
};

// Works whether the API returns the owner as "vendor" or "user", populated or not
const getOwner = (store) => {
  const owner = store.vendor || store.user;
  return owner && typeof owner === 'object' ? owner : null;
};

const getName = (store) => store.businessName || store.name || 'Unnamed store';

const StoreLogo = ({ store }) => (
  <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
    {store.logo?.url ? (
      <img src={store.logo.url} alt="" className="w-full h-full object-cover" />
    ) : (
      <Store className="w-5 h-5 text-slate-400" />
    )}
  </div>
);

const StateBadge = ({ state }) => {
  const style = STATE_STYLES[state];
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${style.cls}`}>{style.label}</span>
  );
};

const ProductCount = ({ count }) => (
  <span className={`inline-flex items-center text-sm font-bold ${count === 0 ? 'text-amber-600' : 'text-slate-700'}`}>
    <Package className={`w-4 h-4 mr-1.5 ${count === 0 ? 'text-amber-400' : 'text-slate-400'}`} />
    {count ?? '-'}
  </span>
);

const VisitButton = ({ store, state }) =>
  state === 'live' ? (
    <a
      href={`/store/${store.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
      title="Visit live store"
    >
      Visit <ExternalLink className="w-3 h-3 ml-1.5" />
    </a>
  ) : (
    <span
      className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
      title={state === 'draft' ? 'This store is a draft, so customers cannot see it yet' : 'This store is not public'}
    >
      Not public
    </span>
  );

const ManageStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError('');
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
          (status ? `Failed to load stores (${status}).` : 'Cannot reach the server. It may be waking up, so please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const counts = useMemo(() => {
    const c = { all: stores.length, live: 0, draft: 0, blocked: 0 };
    stores.forEach((s) => {
      const state = getState(s);
      if (state === 'live') c.live += 1;
      else if (state === 'draft') c.draft += 1;
      else c.blocked += 1;
    });
    return c;
  }, [stores]);

  const filteredStores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return stores.filter((store) => {
      const state = getState(store);
      if (filter === 'live' && state !== 'live') return false;
      if (filter === 'draft' && state !== 'draft') return false;
      if (filter === 'blocked' && state !== 'suspended' && state !== 'banned') return false;

      if (!term) return true;
      const owner = getOwner(store);
      return (
        getName(store).toLowerCase().includes(term) ||
        store.slug?.toLowerCase().includes(term) ||
        owner?.name?.toLowerCase().includes(term) ||
        owner?.email?.toLowerCase().includes(term)
      );
    });
  }, [stores, searchTerm, filter]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="h-96 bg-slate-200 rounded-3xl w-full"></div>
      </div>
    );
  }

  const emptyText = error
    ? 'Stores could not be loaded.'
    : stores.length === 0
      ? 'No stores have been created yet.'
      : 'No stores match your search.';

  return (
    <div className="max-w-7xl mx-auto pb-12">

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Platform Stores</h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Monitor all vendor storefronts created on Vendira. {stores.length > 0 && `(${stores.length} total)`}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="search"
            placeholder="Search by store, slug or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-base sm:text-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-700 shadow-sm">
          <span className="flex items-center min-w-0">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium break-words">{error}</span>
          </span>
          <button onClick={fetchStores} className="text-sm font-bold underline whitespace-nowrap">Try again</button>
        </div>
      )}

      {/* Filters */}
      {stores.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                filter === f.value
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {f.label} <span className="opacity-60">({counts[f.value]})</span>
            </button>
          ))}
        </div>
      )}

      {filteredStores.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
          <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold">{emptyText}</p>
        </div>
      ) : (
        <>
          {/* Phones: one card per store */}
          <ul className="md:hidden space-y-3">
            {filteredStores.map((store) => {
              const owner = getOwner(store);
              const state = getState(store);
              return (
                <li key={store._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <StoreLogo store={store} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5 break-words">
                        {getName(store)}
                        {store.isVerified && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" title="Verified" />}
                      </p>
                      <p className="text-xs font-mono text-slate-500 truncate">/store/{store.slug}</p>
                      <div className="mt-1.5"><StateBadge state={state} /></div>
                    </div>
                    <ProductCount count={store.productCount} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{owner?.name || 'Unknown Vendor'}</p>
                      <p className="text-xs text-slate-500 truncate">{owner?.email || 'N/A'}</p>
                    </div>
                    <VisitButton store={store} state={state} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Larger screens: table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">Store Brand</th>
                    <th className="px-6 py-4">Store Link</th>
                    <th className="px-6 py-4">Vendor Owner</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStores.map((store) => {
                    const owner = getOwner(store);
                    const state = getState(store);
                    return (
                      <tr key={store._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <StoreLogo store={store} />
                            <div className="ml-4 min-w-0">
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                {getName(store)}
                                {store.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" title="Verified" />}
                              </div>
                              <div className="mt-1"><StateBadge state={state} /></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">/store/{store.slug}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-700">{owner?.name || 'Unknown Vendor'}</div>
                          <div className="text-xs text-slate-500">{owner?.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <ProductCount count={store.productCount} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <VisitButton store={store} state={state} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageStores;
