import { useState, useEffect, useRef } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';

// Pulls a readable message out of any kind of failure
const getErrorMessage = (error, fallback) => {
  if (!error.response) {
    return 'Cannot reach the server. Check that the backend is running.';
  }
  const { status, data } = error.response;
  if (status === 404) {
    return 'This feature was not found on the server (404). Restart the backend and try again.';
  }
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  return data?.error || data?.message || fallback;
};

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all text-sm';

const PasswordField = ({ label, value, onChange, className = '', autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const Settings = () => {
  // Profile State
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [savedProfile, setSavedProfile] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // UI State
  const [message, setMessage] = useState({ type: '', text: '' });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const messageTimer = useRef(null);

  const fetchProfile = async () => {
    setLoadFailed(false);
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data?.user;
      if (user) {
        const loaded = { name: user.name || '', email: user.email || '' };
        setProfileData(loaded);
        setSavedProfile(loaded);
      }
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      setLoadFailed(true);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    return () => clearTimeout(messageTimer.current); // no timer firing after unmount
  }, []);

  const showMessage = (type, text) => {
    clearTimeout(messageTimer.current);
    setMessage({ type, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    messageTimer.current = setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  const profileChanged =
    profileData.name.trim() !== savedProfile.name || profileData.email.trim() !== savedProfile.email;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileChanged) return showMessage('error', 'No changes to save.');

    const payload = { name: profileData.name.trim(), email: profileData.email.trim() };

    setProfileLoading(true);
    try {
      const res = await api.put('/auth/updatedetails', payload);
      const user = res.data?.data?.user;
      const updated = { name: user?.name ?? payload.name, email: user?.email ?? payload.email };
      setProfileData(updated);
      setSavedProfile(updated);
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Update profile failed', error.response?.status, error.response?.data);
      showMessage('error', getErrorMessage(error, 'Failed to update profile.'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      return showMessage('error', 'New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return showMessage('error', 'Password must be at least 6 characters.');
    }
    if (newPassword === currentPassword) {
      return showMessage('error', 'New password must be different from your current password.');
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/updatepassword', { currentPassword, newPassword });
      showMessage('success', 'Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Update password failed', error.response?.status, error.response?.data);
      showMessage('error', getErrorMessage(error, 'Failed to update password. Check your current password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your personal account details and security.</p>
      </div>

      {/* Profile failed to load: tell the user instead of showing empty fields */}
      {loadFailed && (
        <div className="p-4 mb-8 rounded-xl flex items-center justify-between gap-4 bg-amber-50 border border-amber-100 text-amber-800">
          <span className="font-medium text-sm">We couldn't load your profile details.</span>
          <button
            onClick={() => { setInitialLoading(true); fetchProfile(); }}
            className="text-sm font-bold underline whitespace-nowrap"
          >
            Try again
          </button>
        </div>
      )}

      {/* Global Feedback Message */}
      {message.text && (
        <div
          role="status"
          className={`p-4 mb-8 rounded-xl flex items-center shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* PROFILE SETTINGS CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 sm:px-8 py-5 flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-4"><User className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
              <p className="text-xs text-gray-500">Update your account name and email address.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading || !profileChanged}
                className="flex items-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-sm text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* SECURITY & PASSWORD CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 sm:px-8 py-5 flex items-center">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600 mr-4"><Lock className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Security</h2>
              <p className="text-xs text-gray-500">Use a long, unique password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 sm:p-8 space-y-5">
            <PasswordField
              label="Current Password"
              autoComplete="current-password"
              className="max-w-md"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
              <PasswordField
                label="New Password"
                autoComplete="new-password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
              <PasswordField
                label="Confirm New Password"
                autoComplete="new-password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-sm text-sm transition-colors disabled:opacity-70"
              >
                {passwordLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Settings;