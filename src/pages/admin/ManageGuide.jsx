import { useState, useEffect } from 'react';
import {
  Video, Mail, Send, Pencil, Trash2, Plus, Save, AlertCircle, CheckCircle,
  Eye, EyeOff, UploadCloud, Link as LinkIcon, Users,
} from 'lucide-react';
import api from '../../api/axios';
import TutorialVideo from '../../components/TutorialVideo';

const EMPTY_FORM = { title: '', description: '', videoUrl: '', order: '', isPublished: true };

const inputClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent';

const ManageGuide = () => {
  const [welcome, setWelcome] = useState({ subject: '', message: '', sendOnRegister: true });
  const [tutorials, setTutorials] = useState([]);
  const [stats, setStats] = useState({ vendors: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [savingWelcome, setSavingWelcome] = useState(false);
  const [emailBusy, setEmailBusy] = useState(''); // '' | 'test' | 'pending' | 'all'

  const [form, setForm] = useState(EMPTY_FORM);
  const [mode, setMode] = useState('link'); // link | upload
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewId, setPreviewId] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const describe = (error, fallback) =>
    error.response?.data?.error ||
    error.response?.data?.message ||
    (error.response ? `${fallback} (error ${error.response.status}).` : 'Cannot reach the server. It may be waking up, so please try again.');

  const refresh = async (initial = false) => {
    try {
      const res = await api.get('/guide/admin');
      const data = res.data?.data;
      if (initial) {
        setWelcome({
          subject: data.welcome.subject,
          message: data.welcome.message,
          sendOnRegister: data.welcome.sendOnRegister,
        });
      }
      setTutorials(data.tutorials || []);
      setStats(data.stats || { vendors: 0, pending: 0 });
    } catch (error) {
      console.error('Load guide failed:', error.response?.status, error.response?.data);
      showMessage('error', describe(error, 'Could not load this page'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(true);
  }, []);

  // ---------- welcome message ----------
  const saveWelcome = async (e) => {
    e.preventDefault();
    setSavingWelcome(true);
    try {
      await api.put('/guide/admin/welcome', welcome);
      showMessage('success', 'Welcome message saved.');
    } catch (error) {
      showMessage('error', describe(error, 'Could not save'));
    } finally {
      setSavingWelcome(false);
    }
  };

  const sendTest = async () => {
    setEmailBusy('test');
    try {
      const res = await api.post('/guide/admin/welcome/test', {}, { timeout: 60000 });
      showMessage('success', res.data?.message || 'Test email sent.');
    } catch (error) {
      showMessage('error', describe(error, 'Could not send the test email'));
    } finally {
      setEmailBusy('');
    }
  };

  const sendToVendors = async (audience) => {
    const who = audience === 'all' ? 'ALL vendors (including ones who already got it)' : `${stats.pending} vendor(s) who haven't received it`;
    if (!window.confirm(`Send the welcome email to ${who}? Save your message first.`)) return;

    setEmailBusy(audience);
    try {
      const res = await api.post('/guide/admin/welcome/send', { audience }, { timeout: 120000 });
      const { sent, failed, remaining } = res.data?.data || {};
      showMessage(
        failed ? 'error' : 'success',
        `Sent ${sent} email(s)${failed ? `, ${failed} failed (check the server logs)` : ''}.${remaining > 0 ? ` ${remaining} more are waiting. Click again to send the next batch.` : ''}`
      );
      refresh();
    } catch (error) {
      showMessage('error', describe(error, 'Could not send the emails'));
    } finally {
      setEmailBusy('');
    }
  };

  // ---------- tutorials ----------
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setMode('link');
    setFile(null);
    setEditingId(null);
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    const uploaded = Boolean(t.video?.public_id);
    setMode(uploaded ? 'upload' : 'link');
    setFile(null);
    setForm({
      title: t.title,
      description: t.description || '',
      videoUrl: uploaded ? '' : t.videoUrl,
      order: String(t.order ?? ''),
      isPublished: t.isPublished,
    });
    document.getElementById('tutorial-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFile = (e) => {
    const picked = e.target.files[0];
    e.target.value = '';
    if (!picked) return;
    if (picked.size > 50 * 1024 * 1024) return showMessage('error', 'That video is over 50MB. Upload a smaller clip, or paste a YouTube link instead.');
    setFile(picked);
  };

  const saveTutorial = async (e) => {
    e.preventDefault();
    if (!editingId && mode === 'upload' && !file) return showMessage('error', 'Choose a video file to upload.');
    if (!editingId && mode === 'link' && !form.videoUrl.trim()) return showMessage('error', 'Paste a video link.');

    setSaving(true);
    setProgress(0);

    const body = new FormData();
    body.append('title', form.title.trim());
    body.append('description', form.description.trim());
    body.append('order', form.order);
    body.append('isPublished', String(form.isPublished));
    if (mode === 'upload' && file) body.append('video', file);
    if (mode === 'link' && form.videoUrl.trim()) body.append('videoUrl', form.videoUrl.trim());

    const config = {
      timeout: 180000,
      onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
    };

    try {
      if (editingId) await api.put(`/guide/admin/tutorials/${editingId}`, body, config);
      else await api.post('/guide/admin/tutorials', body, config);
      showMessage('success', editingId ? 'Tutorial updated.' : 'Tutorial added.');
      resetForm();
      refresh();
    } catch (error) {
      console.error('Save tutorial failed:', error.response?.status, error.response?.data, error.code);
      showMessage('error', error.code === 'ECONNABORTED' ? 'The upload timed out. Try a smaller clip or use a YouTube link.' : describe(error, 'Could not save the tutorial'));
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (t) => {
    try {
      const body = new FormData();
      body.append('isPublished', String(!t.isPublished));
      await api.put(`/guide/admin/tutorials/${t._id}`, body);
      setTutorials((prev) => prev.map((x) => (x._id === t._id ? { ...x, isPublished: !t.isPublished } : x)));
    } catch (error) {
      showMessage('error', describe(error, 'Could not update'));
    }
  };

  const deleteTutorial = async (t) => {
    if (!window.confirm(`Delete "${t.title}"? Vendors will no longer see it.`)) return;
    try {
      await api.delete(`/guide/admin/tutorials/${t._id}`);
      setTutorials((prev) => prev.filter((x) => x._id !== t._id));
      if (editingId === t._id) resetForm();
    } catch (error) {
      showMessage('error', describe(error, 'Could not delete'));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Welcome & Tutorials</h2>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Write the welcome message and add video tutorials. New vendors get them automatically.
        </p>
      </div>

      {message.text && (
        <div role="status" className={`p-3 sm:p-4 rounded-xl flex items-start border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium break-words min-w-0">{message.text}</span>
        </div>
      )}

      {/* WELCOME MESSAGE */}
      <form onSubmit={saveWelcome} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center"><Mail className="w-5 h-5 mr-2 text-emerald-600" /> Welcome message</h3>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">Email subject</label>
          <input id="subject" type="text" required maxLength={150} value={welcome.subject} onChange={(e) => setWelcome({ ...welcome, subject: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label htmlFor="welcome-message" className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
          <textarea id="welcome-message" rows="6" required maxLength={3000} value={welcome.message} onChange={(e) => setWelcome({ ...welcome, message: e.target.value })} className={`${inputClass} resize-y`} />
          <p className="text-xs text-slate-400 mt-1">
            Type <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> to insert the vendor's name. The tutorial list and a "Watch the tutorials" button are added automatically.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <input type="checkbox" checked={welcome.sendOnRegister} onChange={(e) => setWelcome({ ...welcome, sendOnRegister: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
          Email this automatically when someone creates an account
        </label>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
          <button type="button" onClick={sendTest} disabled={Boolean(emailBusy)} className="flex items-center justify-center px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-60">
            <Send className="w-4 h-4 mr-2" /> {emailBusy === 'test' ? 'Sending...' : 'Send me a test'}
          </button>
          <button type="submit" disabled={savingWelcome} className="flex items-center justify-center px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-60">
            <Save className="w-4 h-4 mr-2" /> {savingWelcome ? 'Saving...' : 'Save message'}
          </button>
        </div>
      </form>

      {/* SEND TO EXISTING VENDORS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-slate-900 flex items-center"><Users className="w-5 h-5 mr-2 text-emerald-600" /> Send to existing vendors</h3>
        <p className="text-sm text-slate-500 mt-1">
          {stats.vendors} vendor(s) in total. <strong className="text-slate-800">{stats.pending}</strong> have not received the welcome email yet.
          Each click sends up to 250 emails.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button onClick={() => sendToVendors('pending')} disabled={Boolean(emailBusy) || stats.pending === 0} className="flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4 mr-2" /> {emailBusy === 'pending' ? 'Sending...' : `Send to the ${stats.pending} who haven't got it`}
          </button>
          <button onClick={() => sendToVendors('all')} disabled={Boolean(emailBusy) || stats.vendors === 0} className="flex items-center justify-center px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-50">
            {emailBusy === 'all' ? 'Sending...' : 'Resend to everyone'}
          </button>
        </div>
      </div>

      {/* TUTORIAL FORM */}
      <form id="tutorial-form" onSubmit={saveTutorial} className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-6 space-y-4 scroll-mt-4 ${editingId ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 flex items-center">
            {editingId ? <Pencil className="w-5 h-5 mr-2 text-emerald-600" /> : <Plus className="w-5 h-5 mr-2 text-emerald-600" />}
            {editingId ? 'Edit tutorial' : 'Add a tutorial video'}
          </h3>
          {editingId && <button type="button" onClick={resetForm} className="text-sm font-bold text-slate-500 hover:text-slate-800">Cancel</button>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <label htmlFor="t-title" className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
            <input id="t-title" type="text" required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g. How to add your first product" />
          </div>
          <div>
            <label htmlFor="t-order" className="block text-sm font-semibold text-slate-700 mb-1">Order</label>
            <input id="t-order" type="number" inputMode="numeric" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={inputClass} placeholder="1" />
          </div>
        </div>

        <div>
          <label htmlFor="t-desc" className="block text-sm font-semibold text-slate-700 mb-1">Short description <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="t-desc" rows="2" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-y`} />
        </div>

        <div>
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden text-sm font-bold">
            <button type="button" onClick={() => setMode('link')} className={`flex items-center px-4 py-2 ${mode === 'link' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
              <LinkIcon className="w-4 h-4 mr-1.5" /> Paste a link
            </button>
            <button type="button" onClick={() => setMode('upload')} className={`flex items-center px-4 py-2 ${mode === 'upload' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
              <UploadCloud className="w-4 h-4 mr-1.5" /> Upload a file
            </button>
          </div>

          {mode === 'link' ? (
            <div className="mt-3">
              <input type="url" inputMode="url" aria-label="Video link" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputClass} placeholder="https://www.youtube.com/watch?v=..." />
              <p className="text-xs text-slate-400 mt-1">YouTube (use Unlisted so only people with the link can find it) or Vimeo. Best for longer videos.</p>
            </div>
          ) : (
            <div className="mt-3 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center relative hover:bg-slate-50">
              <input type="file" accept="video/*" aria-label="Choose a video file" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <UploadCloud className="w-7 h-7 text-emerald-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-slate-700 truncate">{file ? file.name : editingId ? 'Choose a new file to replace the current video' : 'Tap to choose a video'}</p>
              <p className="text-xs text-slate-400 mt-0.5">Up to 50MB. MP4 or MOV.</p>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
          Published (visible to vendors)
        </label>

        {saving && file && (
          <div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="text-xs text-slate-500 mt-1.5">Uploading video... {progress}%</p>
          </div>
        )}

        <div className="flex sm:justify-end">
          <button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-60">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add tutorial'}
          </button>
        </div>
      </form>

      {/* TUTORIAL LIST */}
      <div>
        <h3 className="font-bold text-slate-900 flex items-center mb-3"><Video className="w-5 h-5 mr-2 text-emerald-600" /> Your tutorials ({tutorials.length})</h3>
        {tutorials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 text-sm">No tutorials yet. Add your first one above.</div>
        ) : (
          <ul className="space-y-3">
            {tutorials.map((t) => (
              <li key={t._id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 ${editingId === t._id ? 'ring-2 ring-emerald-200' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 break-words"><span className="text-slate-400 mr-2">#{t.order}</span>{t.title}</p>
                    {t.description && <p className="text-sm text-slate-500 mt-0.5 break-words">{t.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${t.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{t.isPublished ? 'Published' : 'Draft'}</span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">{t.video?.public_id ? 'Uploaded' : 'Link'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewId(previewId === t._id ? null : t._id)} className="text-sm font-bold text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg">{previewId === t._id ? 'Hide' : 'Preview'}</button>
                    <button onClick={() => togglePublished(t)} aria-label={t.isPublished ? 'Unpublish' : 'Publish'} title={t.isPublished ? 'Unpublish' : 'Publish'} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">{t.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    <button onClick={() => startEdit(t)} aria-label={`Edit ${t.title}`} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteTutorial(t)} aria-label={`Delete ${t.title}`} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {previewId === t._id && <div className="mt-4"><TutorialVideo url={t.videoUrl} title={t.title} /></div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageGuide;
