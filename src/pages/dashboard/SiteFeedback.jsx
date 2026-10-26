import { useState, useEffect } from 'react';
import { Star, Send, AlertCircle, CheckCircle, MessageSquare, CornerDownRight } from 'lucide-react';
import api from '../../api/axios';

const MAX_LENGTH = 1000;

const TYPES = [
  { value: 'review', label: 'Review of Vendira' },
  { value: 'suggestion', label: 'Suggestion or feature idea' },
  { value: 'bug', label: 'Something is not working' },
  { value: 'other', label: 'Other' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

const STATUS = {
  new: { label: 'Received', cls: 'bg-blue-50 text-blue-700' },
  reviewed: { label: 'Seen by our team', cls: 'bg-amber-50 text-amber-700' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700' },
};

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const Stars = ({ rating, className = 'w-4 h-4' }) => (
  <div className="flex" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${className} ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

const RATING_WORDS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent' };

const SiteFeedback = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [type, setType] = useState('review');
  const [text, setText] = useState('');

  const showMessage = (kind, msg) => {
    setMessage({ type: kind, text: msg });
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/feedback/mine');
        setItems(res.data?.data?.feedback || []);
      } catch (error) {
        console.error('Load feedback failed:', error.response?.status, error.response?.data);
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Could not load your previous feedback.',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) return showMessage('error', 'Please tap the stars to give a rating.');

    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/feedback', { rating, type, message: text.trim() });
      const created = res.data?.data?.feedback;
      if (created) setItems((prev) => [created, ...prev]);
      setRating(0);
      setHover(0);
      setType('review');
      setText('');
      showMessage('success', 'Thank you! Your feedback has been sent. We will reply here and by email.');
    } catch (error) {
      console.error('Send feedback failed:', error.response?.status, error.response?.data);
      showMessage(
        'error',
        error.response?.data?.error ||
          (error.response ? 'Could not send your feedback.' : 'Cannot reach the server. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const shown = hover || rating;

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-6 h-6 mr-2 text-[#128C7E] flex-shrink-0" />
          Feedback
        </h2>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Tell us how Vendira is working for you. We read every message and reply here.
        </p>
      </div>

      {message.text && (
        <div
          role="status"
          className={`mb-6 p-3 sm:p-4 rounded-xl flex items-start border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium break-words min-w-0">{message.text}</span>
        </div>
      )}

      {/* SUBMIT FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-5 sm:space-y-6"
      >
        <div>
          <p className="block text-sm font-semibold text-gray-700 mb-2">How would you rate Vendira?</p>
          <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={rating === n}
                className="p-1 -m-0.5 focus:outline-none focus:ring-2 focus:ring-[#25D366] rounded-lg"
              >
                <Star className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${n <= shown ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
            {shown > 0 && <span className="ml-3 text-sm font-semibold text-gray-600">{RATING_WORDS[shown]}</span>}
          </div>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-1">What is this about?</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} bg-white sm:w-1/2`}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">Your message</label>
          <textarea
            id="message"
            rows="4"
            required
            minLength={5}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="What do you like? What could be better? Tell us anything."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/{MAX_LENGTH}</p>
        </div>

        <div className="flex sm:justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 sm:py-3 bg-[#128C7E] text-white font-bold rounded-xl hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Sending...' : 'Send feedback'}
          </button>
        </div>
      </form>

      {/* PREVIOUS SUBMISSIONS */}
      <div className="mt-8 sm:mt-10">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your previous feedback</h3>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 bg-gray-200 rounded-2xl"></div>
            <div className="h-28 bg-gray-200 rounded-2xl"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-gray-100">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">You haven't sent any feedback yet.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const status = STATUS[item.status] || STATUS.new;
              return (
                <li key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars rating={item.rating} />
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.cls}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {TYPE_LABEL[item.type] || 'Feedback'} · {formatDate(item.createdAt)}
                  </p>
                  <p className="text-sm text-gray-800 mt-2 whitespace-pre-line break-words">{item.message}</p>

                  {item.adminReply?.message && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4">
                      <p className="text-xs font-bold text-[#128C7E] flex items-center">
                        <CornerDownRight className="w-3.5 h-3.5 mr-1" /> Reply from the Vendira team
                        {item.adminReply.repliedAt && (
                          <span className="ml-2 font-normal text-gray-400">{formatDate(item.adminReply.repliedAt)}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-800 mt-1.5 whitespace-pre-line break-words">{item.adminReply.message}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SiteFeedback;
