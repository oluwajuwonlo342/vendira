import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Store, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

const inputClass =
  'appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] text-base sm:text-sm transition-colors';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Send the user to the login page shortly after a successful reset
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => navigate('/login', { state: { passwordReset: true } }), 2500);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await api.put(`/auth/resetpassword/${token}`, { password });
      setDone(true);
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Please check your connection and try again.');
      } else {
        const msg = err.response.data?.error || err.response.data?.message || 'Something went wrong. Please try again.';
        if (err.response.status === 400 && /invalid|expired/i.test(msg)) setLinkInvalid(true);
        setError(msg);
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
        <h2 className="mt-5 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">Choose a new password</h2>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-5 sm:py-8 sm:px-10 shadow-xl border border-emerald-50 rounded-2xl">

          {done ? (
            <div role="status" className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">Password updated</h3>
              <p className="text-sm text-gray-600 mt-1">Taking you to the login page...</p>
              <Link to="/login" className="inline-block mt-4 text-sm font-semibold text-[#128C7E] hover:text-[#075E54]">
                Log in now
              </Link>
            </div>
          ) : linkInvalid ? (
            <div role="alert" className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">Link expired or invalid</h3>
              <p className="text-sm text-gray-600 mt-1">Reset links work once and expire after 30 minutes.</p>
              <Link
                to="/forgot-password"
                className="inline-block mt-5 px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold rounded-xl text-sm transition-colors"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 flex items-start rounded-r-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 break-words min-w-0">{error}</p>
                </div>
              )}

              <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">New password</label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700">Confirm new password</label>
                  <div className="mt-1">
                    <input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-base sm:text-sm font-bold text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Reset password'}
                  {!loading && <KeyRound className="w-4 h-4 ml-2" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
