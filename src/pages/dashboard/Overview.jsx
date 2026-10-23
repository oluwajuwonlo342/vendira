import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, MessageSquare, ExternalLink, PlusCircle, Store, RefreshCcw } from 'lucide-react';
import api from '../../api/axios';

const Overview = () => {
  const [storeName, setStoreName] = useState('Vendor');
  const [storeSlug, setStoreSlug] = useState('');
  const [stats, setStats] = useState({ products: 0, views: 0, clicks: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate the time of day for the greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Wrapped in useCallback so we can call it on mount and on manual refresh
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Store Profile
      const storeRes = await api.get('/stores/my-store');
      if (storeRes.data?.data?.store) {
        const storeData = storeRes.data.data.store;
        setStoreName(storeData.name || storeData.businessName || 'Vendor');
        setStoreSlug(storeData.slug);
      }

      // 2. Fetch Products to calculate metrics
      const productsRes = await api.get('/products');
      const products = productsRes.data?.data?.products || [];

      // 3. Aggregate Stats using the new database fields
      const totalProducts = products.length;
      const totalViews = products.reduce((sum, item) => sum + (item.views || 0), 0);
      const totalClicks = products.reduce((sum, item) => sum + (item.whatsappClicks || 0), 0);

      setStats({
        products: totalProducts,
        views: totalViews,
        clicks: totalClicks
      });

    } catch (error) {
      console.log("Dashboard data not fully set up yet.");
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchDashboardData().finally(() => setLoading(false));
  }, [fetchDashboardData]);

  // Manual Refresh triggered by user
  const handleRefreshStats = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    // Tiny delay so the user can see the spin animation happen
    setTimeout(() => setRefreshing(false), 500); 
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 p-6">
        <div className="h-40 bg-gray-200 rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* =======================
          HERO GREETING SECTION
          ======================= */}
      <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-20 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-emerald-100 font-semibold tracking-wide uppercase text-sm mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
              {getGreeting()}, {storeName}! 👋
            </h1>
            <p className="text-emerald-50 max-w-xl text-sm sm:text-base">
              Welcome to your Vendira control center. Manage your products, update your store settings, and watch your WhatsApp orders roll in.
            </p>
          </div>
          
          <button 
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="flex items-center justify-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl backdrop-blur-sm transition-all disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Live Stats'}
          </button>
        </div>
      </div>

      {/* =======================
          DYNAMIC STATS GRID
          ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-4 rounded-xl text-[#128C7E] mr-5">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Total Products</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.products}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600 mr-5">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Store Views</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.views}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="bg-green-50 p-4 rounded-xl text-[#25D366] mr-5">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">WhatsApp Clicks</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.clicks}</h3>
          </div>
        </div>
      </div>

      {/* =======================
          QUICK ACTIONS
          ======================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/dashboard/products" className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#25D366] hover:bg-emerald-50 transition-all text-center cursor-pointer">
            <PlusCircle className="w-8 h-8 text-gray-400 group-hover:text-[#25D366] mb-3 transition-colors" />
            <span className="font-bold text-gray-700 group-hover:text-gray-900">Add New Product</span>
            <span className="text-xs text-gray-500 mt-1">Upload items to your catalogue</span>
          </Link>

          <Link to="/dashboard/store" className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#128C7E] hover:bg-emerald-50 transition-all text-center cursor-pointer">
            <Store className="w-8 h-8 text-gray-400 group-hover:text-[#128C7E] mb-3 transition-colors" />
            <span className="font-bold text-gray-700 group-hover:text-gray-900">Edit Store Profile</span>
            <span className="text-xs text-gray-500 mt-1">Update your name & number</span>
          </Link>

          {storeSlug ? (
            <a href={`/store/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center p-6 border-2 border-gray-100 bg-gray-50 rounded-xl hover:border-gray-300 hover:bg-gray-100 transition-all text-center cursor-pointer">
              <ExternalLink className="w-8 h-8 text-gray-500 group-hover:text-gray-700 mb-3 transition-colors" />
              <span className="font-bold text-gray-700 group-hover:text-gray-900">View Public Store</span>
              <span className="text-xs text-gray-500 mt-1 text-[#128C7E] truncate max-w-[150px]">/{storeSlug}</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 bg-gray-50 rounded-xl text-center opacity-60">
              <ExternalLink className="w-8 h-8 text-gray-300 mb-3" />
              <span className="font-bold text-gray-400">View Public Store</span>
              <span className="text-xs text-gray-400 mt-1">Setup store first</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Overview;