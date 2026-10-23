import { useState, useEffect } from 'react';
import { Save, Globe, Shield, CreditCard, Server, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    platformName: '',
    supportEmail: '',
    maxProductsPerStore: 50,
    platformFeePercentage: 2.5,
    enableSignups: true,
    maintenanceMode: false,
    autoApproveStores: true
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Fetch live settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data?.data) {
          setSettings(res.data.data);
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to load platform settings from database.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear status message when user types
    if (statusMessage.text) setStatusMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await api.put('/admin/settings', settings);
      setSettings(res.data.data);
      setStatusMessage({ type: 'success', text: 'Platform settings updated successfully!' });
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to save settings.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">System Settings</h2>
        <p className="text-slate-500 mt-1">Configure global platform rules, limits, and security protocols.</p>
      </div>

      {statusMessage.text && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center shadow-sm border ${
          statusMessage.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
        }`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          ) : (
             <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          )}
          <span className="text-sm font-bold">{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 p-6 flex items-center bg-slate-50/50">
            <Globe className="w-5 h-5 text-slate-400 mr-3" />
            <h3 className="text-lg font-bold text-slate-900">General Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Platform Name</label>
              <input type="text" name="platformName" value={settings.platformName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
              <input type="email" name="supportEmail" value={settings.supportEmail || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" required />
            </div>
          </div>
        </div>

        {/* Limits & Fees */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 p-6 flex items-center bg-slate-50/50">
            <Server className="w-5 h-5 text-slate-400 mr-3" />
            <h3 className="text-lg font-bold text-slate-900">Limits & Economics</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Default Max Products (per store)</label>
              <input type="number" name="maxProductsPerStore" value={settings.maxProductsPerStore || 0} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Global Platform Fee (%)</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="number" step="0.1" name="platformFeePercentage" value={settings.platformFeePercentage || 0} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" required />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 p-6 flex items-center bg-slate-50/50">
            <Shield className="w-5 h-5 text-slate-400 mr-3" />
            <h3 className="text-lg font-bold text-slate-900">Security & Access</h3>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <div className="text-sm font-bold text-slate-900">Enable Vendor Signups</div>
                <div className="text-xs text-slate-500">Allow new users to register as vendors.</div>
              </div>
              <input type="checkbox" name="enableSignups" checked={!!settings.enableSignups} onChange={handleChange} className="w-5 h-5 text-slate-900 rounded focus:ring-slate-900" />
            </label>
            
            <label className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <div className="text-sm font-bold text-slate-900">Auto-Approve New Stores</div>
                <div className="text-xs text-slate-500">Stores go live immediately without admin manual review.</div>
              </div>
              <input type="checkbox" name="autoApproveStores" checked={!!settings.autoApproveStores} onChange={handleChange} className="w-5 h-5 text-slate-900 rounded focus:ring-slate-900" />
            </label>

            <label className="flex items-center justify-between p-4 border border-red-100 bg-red-50/50 rounded-xl hover:bg-red-50 cursor-pointer transition-colors">
              <div>
                <div className="text-sm font-bold text-red-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Maintenance Mode
                </div>
                <div className="text-xs text-red-700">Disable storefronts and block vendor logins (Super Admins bypass).</div>
              </div>
              <input type="checkbox" name="maintenanceMode" checked={!!settings.maintenanceMode} onChange={handleChange} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSaving} className="flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-70 transition-all shadow-sm">
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving Configurations...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;