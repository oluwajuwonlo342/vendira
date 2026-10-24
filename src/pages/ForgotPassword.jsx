import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

const inputClass =
  'appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] text-base sm:text-sm transition-colors';

const RESEND_SECONDS = 60;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgotpassword', { email: email.trim() });
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. It may be waking up, so please try again in a moment.');
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
        <h2 className="mt-5 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">Forgot your password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we'll send you a link to reset it.
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

          {sent && (
            <div role="status" className="mb-5 bg-emerald-50 border border-emerald-100 p-3 sm:p-4 flex items-start rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800 min-w-0">
                <p className="font-semibold">Check your email</p>
                <p className="mt-1">
                  If an account exists for <span className="font-semibold break-all">{email.trim()}</span>, a reset
                  link is on its way. It expires in 30 minutes. Check your spam folder if you don't see it.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full flex justify-center items-center py-3.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-base sm:text-sm font-bold text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Sending...'
              ) : cooldown > 0 ? (
                `Send again in ${cooldown}s`
              ) : (
                <>
                  {sent ? 'Send again' : 'Send reset link'}
                  <Mail className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-[#128C7E] hover:text-[#075E54]">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
