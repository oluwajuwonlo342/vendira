import { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, AlertCircle, CheckCircle, Send, Search } from 'lucide-react';
import api from '../../api/axios';

const TYPE_LABEL = {
  review: 'Review',
  suggestion: 'Suggestion',
  bug: 'Problem',
  other: 'Other',
};

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700',
  reviewed: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
];

const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const Stars = ({ rating }) => (
  <div className="flex" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

// One feedback card with its own reply box
const FeedbackCard = ({ item, onSaved }) => {
  const [reply, setReply] = useState(item.adminReply?.message || '');
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({ type: '', text: '' });

  const dirty = reply.trim() !== (item.adminReply?.message || '') || status !== item.status;

  const handleSave = async () => {
    setSaving(true);
    setNote({ type: '', text: '' });
    try {
      const res = await api.put(`/feedback/admin/${item._id}`, { message: reply.trim() || undefined, status });
      const updated = res.data?.data?.feedback;
      if (updated) onSaved({ ...item, ...updated, vendor: item.vendor, store: item.store });
      setNote({ type: 'success', text: 'Saved. The vendor has been emailed your reply.' });
    } catch (error) {
      setNote({
        type: 'error',
        text: error.response?.data?.error || (error.response ? 'Could not save.' : 'Cannot reach the server.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate">{item.vendor?.name || 'Unknown vendor'}</p>
          <p className="text-xs text-slate-500 truncate">
            {item.vendor?.email || 'N/A'}
            {item.store?.businessName ? ` · ${item.store.businessName}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Stars rating={item.rating} />
          <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
          {TYPE_LABEL[item.type] || 'Feedback'}
        </span>
        <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_STYLES[item.status] || STATUS_STYLES.new}`}>
          {item.status}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-800 whitespace-pre-line break-words">{item.message}</p>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        <label htmlFor={`reply-${item._id}`} className="block text-sm font-semibold text-slate-700">
          Your reply {item.adminReply?.repliedAt && <span className="font-normal text-slate-400">(sent {formatDate(item.adminReply.repliedAt)})</span>}
        </label>
        <textarea
          id={`reply-${item._id}`}
          rows="3"
          maxLength={2000}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-y"
          placeholder="Write a reply. The vendor sees it in their dashboard and by email."
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="sm:ml-auto flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : reply.trim() && reply.trim() !== (item.adminReply?.message || '') ? 'Send reply' : 'Save status'}
          </button>
        </div>

        {note.text && (
          <p className={`text-xs font-semibold flex items-center ${note.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
            {note.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
            {note.text}
          </p>
        )}
      </div>
    </li>
  );
};

const ManageFeedback = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, newCount: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/feedback/admin');
        setItems(res.data?.data?.feedback || []);
        setStats(res.data?.data?.stats || { total: 0, newCount: 0, averageRating: 0 });
      } catch (err) {
        console.error('Load feedback failed:', err.response?.status, err.response?.data);
        const status = err.response?.status;
        setError(
          err.response?.data?.error ||
            (status ? `Failed to load feedback (${status}).` : 'Cannot reach the server.')
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaved = (updated) => {
    setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== 'all' && i.status !== filter) return false;
      if (!q) return true;
      return (
        i.message?.toLowerCase().includes(q) ||
        i.vendor?.name?.toLowerCase().includes(q) ||
        i.vendor?.email?.toLowerCase().includes(q) ||
        i.store?.businessName?.toLowerCase().includes(q)
      );
    });
  }, [items, filter, search]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Vendor Feedback</h2>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Read what vendors say about Vendira and reply to them.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Total</p>
          <p className="text-xl sm:text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Awaiting reply</p>
          <p className="text-xl sm:text-3xl font-black text-blue-600">{stats.newCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Avg. rating</p>
          <p className="text-xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-1">
            {stats.averageRating || '-'}
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
          </p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
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
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="search"
            placeholder="Search vendor or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold">
            {error ? 'Feedback could not be loaded.' : items.length === 0 ? 'No feedback yet.' : 'Nothing matches that filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => (
            <FeedbackCard key={item._id} item={item} onSaved={handleSaved} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageFeedback;
