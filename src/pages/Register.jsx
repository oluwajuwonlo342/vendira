import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

// text-base on phones stops iOS Safari zooming into focused inputs; text-sm from sm up
const inputClass =
  'appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] text-base sm:text-sm transition-colors';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await api.post('/auth/register', {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
    });
    localStorage.setItem('vendira_token', response.data.token);
    navigate('/dashboard/setup'); // changed from '/dashboard'
  } catch (err) {
    if (!err.response) {
      setError('Cannot reach the server. Check your connection and try again.');
    } else {
      setError(err.response.data?.error || err.response.data?.message || 'Something went wrong. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F4FBF7] flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 font-sans">
      <div className="mx-auto w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center text-2xl sm:text-3xl font-black tracking-tight text-[#128C7E]">
          <Store className="w-7 h-7 sm:w-8 sm:h-8 mr-2 text-[#25D366]" />
          Vendira.
        </Link>
        <h2 className="mt-5 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
          Create your free account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-[#128C7E] hover:text-[#075E54]">
            log in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-5 sm:py-8 sm:px-10 shadow-xl border border-emerald-50 rounded-2xl">

          {error && (
            <div role="alert" className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 flex items-start rounded-r-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 break-words min-w-0">{error}</p>
            </div>
          )}

          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Business / Full Name</label>
              <div className="mt-1">
                <input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="e.g. My Gadget Hub" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">WhatsApp Number</label>
              <div className="mt-1">
                <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={formData.phone} onChange={handleChange} className={inputClass} placeholder="08012345678" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-12`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-base sm:text-sm font-bold text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 sm:pt-6">
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-[#25D366] mr-2 flex-shrink-0" /> No credit card required
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-[#25D366] mr-2 flex-shrink-0" /> Setup takes less than 2 minutes
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
