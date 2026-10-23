import { useState, useEffect } from 'react';
import { Users, Store, Package, Eye, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const AdminOverview = () => {
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalPlatformViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGlobalStats = async () => {
    try {
      setError('');
      const res = await api.get('/admin/stats');
      
      // Extract stats from backend response payload
      const stats = res.data?.data || res.data;
      
      setPlatformStats({
        totalUsers: stats.totalUsers || 0,
        totalStores: stats.totalStores || 0,
        totalProducts: stats.totalProducts || 0,
        totalPlatformViews: stats.totalPlatformViews || 0
      });
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load real-time platform metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchGlobalStats();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Vendors', value: platformStats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Stores', value: platformStats.totalStores, icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Total Products', value: platformStats.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Global Views', value: platformStats.totalPlatformViews, icon: Eye, color: 'text-orange-600', bg: 'bg-orange-100' }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Header & Live Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Platform Health</h2>
          <p className="text-slate-500 mt-1">Live statistics queried dynamically across all database collections.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Metrics
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">{stat.value.toLocaleString()}</h3>
              <p className="text-sm font-bold text-slate-500 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Activity Placeholder */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Recent Platform Activity</h3>
        <p className="text-sm text-slate-500">Real-time audit log of new vendor registrations and store creations will be listed here.</p>
      </div>
      
    </div>
  );
};

export default AdminOverview;