import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Users,
  Store,
  Activity,
  LogOut,
  Menu,
  X,
  Settings,
  MessageSquare,
} from 'lucide-react';
import api from '../../api/axios';

import AdminOverview from './AdminOverview';
import ManageVendors from './ManageVendors';
import ManageStores from './ManageStores';
import ManageFeedback from './ManageFeedback';
import SystemSettings from './SystemSettings';
import ManageGuide from './ManageGuide';

const adminLinks = [
  { name: 'Platform Overview', path: '/admin', icon: Activity },
  { name: 'Manage Vendors', path: '/admin/users', icon: Users },
  { name: 'All Stores', path: '/admin/stores', icon: Store },
  { name: 'Feedback', path: '/admin/feedback', icon: MessageSquare },
  { name: 'System Settings', path: '/admin/settings', icon: Settings },
  // in adminLinks, after Feedback:
{ name: 'Welcome & Tutorials', path: '/admin/guide', icon: Video },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkError, setCheckError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Ignore a trailing slash so /admin/ and /admin both match
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';

  // Verify admin status with the server (the role is never trusted from localStorage)
  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      const token = localStorage.getItem('vendira_token');
      if (!token) return navigate('/login');

      setLoading(true);
      setCheckError('');
      try {
        const res = await api.get('/auth/me');
        const role = String(res.data?.data?.user?.role || '').toUpperCase();
        if (cancelled) return;

        if (role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          navigate('/dashboard'); // normal vendors go to their own dashboard
        }
      } catch (error) {
        if (cancelled) return;
        if (error.response?.status === 401) {
          localStorage.removeItem('vendira_token');
          localStorage.removeItem('vendira_user');
          navigate('/login');
        } else {
          // Server asleep or unreachable: show a retry instead of kicking the admin out
          setCheckError(
            error.response?.data?.error ||
              'Could not verify your account. The server may be waking up. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAdmin();
    return () => { cancelled = true; };
  }, [navigate, attempt]);

  // Close the drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // While the mobile drawer is open: Escape closes it and the page behind doesn't scroll
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  // Start each page at the top when switching sections
  useEffect(() => {
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('vendira_token');
    localStorage.removeItem('vendira_user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (checkError) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <Shield className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-700 font-semibold max-w-sm">{checkError}</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="mt-5 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pageTitle = adminLinks.find((link) => link.path === currentPath)?.name || 'Admin Panel';

  return (
    // Fixed viewport height: sidebar and header stay put, only the content area scrolls
    <div className="h-screen h-[100dvh] bg-slate-50 flex font-sans overflow-hidden">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin sidebar: darker theme to distinguish it from the vendor dashboard */}
      <aside
        className={`fixed inset-y-0 left-0 bg-slate-900 w-64 max-w-[85vw] z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:max-w-none md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col text-slate-300">
          <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <Shield className="w-6 h-6 text-emerald-400 mr-2 flex-shrink-0" />
            <span className="text-xl font-black text-white truncate">Vendira Admin</span>
            <button
              className="ml-auto md:hidden p-2 -mr-2"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1.5 sm:space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">Management</p>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-colors ${
                    isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-400 font-semibold rounded-xl hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8">
          <button
            className="md:hidden -ml-2 mr-3 p-2 text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{pageTitle}</h1>
        </header>

        <div id="dashboard-scroll" className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<ManageVendors />} />
            <Route path="/stores" element={<ManageStores />} />
            <Route path="/feedback" element={<ManageFeedback />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/guide" element={<ManageGuide />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
