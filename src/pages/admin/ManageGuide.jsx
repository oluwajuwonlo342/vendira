import { useState, useEffect } from 'react';
import {
  Video, Mail, Send, Pencil, Trash2, Plus, Save, AlertCircle, CheckCircle,
  Eye, EyeOff, UploadCloud, Link as LinkIcon, Users, FileText, Zap,
} from 'lucide-react';
import api from '../../api/axios';
import TutorialVideo from '../../components/TutorialVideo';

const EMPTY_FORM = { title: '', description: '', videoUrl: '', order: '', isPublished: true };
const EMPTY_TEMPLATE = { name: '', subject: '', message: '', buttonLabel: '', buttonUrl: '', includeTutorials: false };

const AUDIENCES = [
  { value: 'latest', label: 'The latest sign-ups' },
  { value: 'recent', label: 'Everyone who joined recently' },
  { value: 'all', label: 'All vendors' },
  { value: 'no-store', label: "Vendors who haven't set up a store yet" },
  { value: 'no-product', label: 'Vendors with a store but no products yet' },
];

const inputClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent';

const Toggle = ({ checked, onChange, label, hint, disabled = false }) => (
  <div className={`flex items-start gap-3 ${disabled ? 'opacity-50' : ''}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
    <span className="text-sm">
      <span className="font-semibold text-slate-800 block">{label}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </span>
  </div>
);

const ManageGuide = () => {
  const [welcome, setWelcome] = useState({ subject: '', message: '', sendOnRegister: true, includeTutorialsOnRegister: true });
  const [templates, setTemplates] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [stats, setStats] = useState({ vendors: 0, welcomeNotSent: 0, publishedTutorials: 0, batchLimit: 250 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [savingWelcome, setSavingWelcome] = useState(false);

  // templates
  const [tplForm, setTplForm] = useState(EMPTY_TEMPLATE);
  const [tplEditing, setTplEditing] = useState(null); // null | 'new' | a template id
  const [savingTpl, setSavingTpl] = useState(false);

  // sending
  const [send, setSend] = useState({
    template: 'welcome',
    audience: 'latest',
    count: '5',
    days: '7',
    skipAlreadySent: true,
    includeTutorials: true,
  });
  const [preview, setPreview] = useState({ state: 'idle', data: null, message: '' });
  const [previewTick, setPreviewTick] = useState(0);
  const [busy, setBusy] = useState(''); // '' | 'test' | 'send'

  // tutorials
  const [form, setForm] = useState(EMPTY_FORM);
  const [mode, setMode] = useState('link'); // link | upload
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewId, setPreviewId] = useState(null);

  const noPublished = stats.publishedTutorials === 0;
  const withTutorials = send.includeTutorials && !noPublished;
  const selectedTemplateName =
    send.template === 'welcome' ? 'Welcome email' : templates.find((t) => t._id === send.template)?.name || 'this message';

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
          includeTutorialsOnRegister: data.welcome.includeTutorialsOnRegister !== false,
        });
        setSend((s) => ({ ...s, includeTutorials: data.welcome.includeTutorialsOnRegister !== false }));
      }
      setTemplates(data.templates || []);
      setTutorials(data.tutorials || []);
      setStats((prev) => ({ ...prev, ...(data.stats || {}) }));
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

  // Live count of who would receive the message. Late answers are ignored.
  useEffect(() => {
    if (loading) return undefined;
    let cancelled = false;
    setPreview((p) => ({ ...p, state: 'loading' }));

    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/guide/admin/messages/preview', {
          template: send.template,
          audience: send.audience,
          count: Number(send.count) || 5,
          days: Number(send.days) || 7,
          skipAlreadySent: send.skipAlreadySent,
        });
        if (!cancelled) setPreview({ state: 'ready', data: res.data?.data, message: '' });
      } catch (error) {
        if (!cancelled) setPreview({ state: 'error', data: null, message: describe(error, 'Could not check who would receive this') });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, send.template, send.audience, send.count, send.days, send.skipAlreadySent, previewTick]);

  // ---------- welcome email ----------
  const saveWelcome = async (e) => {
    e.preventDefault();
    setSavingWelcome(true);
    try {
      await api.put('/guide/admin/welcome', welcome);
      showMessage('success', 'Welcome email saved.');
      setPreviewTick((n) => n + 1);
    } catch (error) {
      showMessage('error', describe(error, 'Could not save'));
    } finally {
      setSavingWelcome(false);
    }
  };

  // ---------- templates ----------
  const startNewTemplate = () => {
    setTplForm(EMPTY_TEMPLATE);
    setTplEditing('new');
    setTimeout(() => document.getElementById('template-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const startEditTemplate = (t) => {
    setTplForm({
      name: t.name,
      subject: t.subject,
      message: t.message,
      buttonLabel: t.buttonLabel || '',
      buttonUrl: t.buttonUrl || '',
      includeTutorials: Boolean(t.includeTutorials),
    });
    setTplEditing(t._id);
    setTimeout(() => document.getElementById('template-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const closeTemplateForm = () => {
    setTplEditing(null);
    setTplForm(EMPTY_TEMPLATE);
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    setSavingTpl(true);
    try {
      const isNew = tplEditing === 'new';
      const res = isNew
        ? await api.post('/guide/admin/templates', tplForm)
        : await api.put(`/guide/admin/templates/${tplEditing}`, tplForm);
      const saved = res.data?.data?.template;

      setTemplates((prev) => (isNew ? [saved, ...prev] : prev.map((t) => (t._id === saved._id ? saved : t))));
      if (isNew) selectTemplate(saved._id, saved);
      closeTemplateForm();
      showMessage('success', isNew ? 'Template created. It is ready to send below.' : 'Template saved.');
    } catch (error) {
      showMessage('error', describe(error, 'Could not save the template'));
    } finally {
      setSavingTpl(false);
    }
  };

  const deleteTemplate = async (t) => {
    if (!window.confirm(`Delete the template "${t.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/guide/admin/templates/${t._id}`);
      setTemplates((prev) => prev.filter((x) => x._id !== t._id));
      if (send.template === t._id) selectTemplate('welcome');
      if (tplEditing === t._id) closeTemplateForm();
    } catch (error) {
      showMessage('error', describe(error, 'Could not delete the template'));
    }
  };

  // ---------- sending ----------
  const selectTemplate = (key, tpl) => {
    const found = tpl || templates.find((t) => t._id === key);
    setSend((s) => ({
      ...s,
      template: key,
      includeTutorials: key === 'welcome' ? welcome.includeTutorialsOnRegister : Boolean(found?.includeTutorials),
    }));
  };

  const useTemplateToSend = (t) => {
    selectTemplate(t._id, t);
    document.getElementById('send-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sendTest = async () => {
    setBusy('test');
    try {
      const res = await api.post(
        '/guide/admin/messages/test',
        { template: send.template, includeTutorials: withTutorials },
        { timeout: 60000 }
      );
      showMessage('success', res.data?.message || 'Test email sent.');
    } catch (error) {
      showMessage('error', describe(error, 'Could not send the test email'));
    } finally {
      setBusy('');
    }
  };

  const sendMessage = async () => {
    const p = preview.data;
    if (!p || p.willSend === 0) return;
    const content = withTutorials ? 'with the tutorial videos' : 'without the tutorial videos';
    if (!window.confirm(`Send "${selectedTemplateName}" ${content} to ${p.willSend} vendor${p.willSend === 1 ? '' : 's'}? It uses the last saved version of the template.`)) return;

    setBusy('send');
    try {
      const res = await api.post(
        '/guide/admin/messages/send',
        {
          template: send.template,
          audience: send.audience,
          count: Number(send.count) || 5,
          days: Number(send.days) || 7,
          skipAlreadySent: send.skipAlreadySent,
          includeTutorials: withTutorials,
        },
        { timeout: 120000 }
      );
      const { sent, failed, remaining } = res.data?.data || {};
      showMessage(
        failed ? 'error' : 'success',
        `Sent ${sent} email${sent === 1 ? '' : 's'}${failed ? `, ${failed} failed (check the server logs)` : ''}.${remaining > 0 ? ` ${remaining} more are waiting. Click send again for the next batch.` : ''}`
      );
      refresh();
      setPreviewTick((n) => n + 1);
    } catch (error) {
      showMessage('error', describe(error, 'Could not send the emails'));
    } finally {
      setBusy('');
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
      setStats((prev) => ({ ...prev, publishedTutorials: Math.max(prev.publishedTutorials + (t.isPublished ? -1 : 1), 0) }));
    } catch (error) {
      showMessage('error', describe(error, 'Could not update'));
    }
  };

  const deleteTutorial = async (t) => {
    if (!window.confirm(`Delete "${t.title}"? Vendors will no longer see it.`)) return;
    try {
      await api.delete(`/guide/admin/tutorials/${t._id}`);
      setTutorials((prev) => prev.filter((x) => x._id !== t._id));
      if (t.isPublished) setStats((prev) => ({ ...prev, publishedTutorials: Math.max(prev.publishedTutorials - 1, 0) }));
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

  const p = preview.data;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Emails & Tutorials</h2>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Set up the welcome email, write your own message templates, and send them to the vendors you choose.
        </p>
      </div>

      {message.text && (
        <div role="status" className={`p-3 sm:p-4 rounded-xl flex items-start border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium break-words min-w-0">{message.text}</span>
        </div>
      )}

      {/* 1. WELCOME EMAIL TEMPLATE */}
      <form onSubmit={saveWelcome} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center"><Zap className="w-5 h-5 mr-2 text-emerald-600" /> Welcome email for new users</h3>

        <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-4">
          <Toggle
            checked={welcome.sendOnRegister}
            onChange={(v) => setWelcome({ ...welcome, sendOnRegister: v })}
            label="Send this email automatically after someone creates an account"
            hint={welcome.sendOnRegister ? 'Every new vendor gets it right after signing up.' : "New vendors won't get it automatically. You can still send it by hand below."}
          />
          <Toggle
            checked={welcome.includeTutorialsOnRegister}
            onChange={(v) => setWelcome({ ...welcome, includeTutorialsOnRegister: v })}
            label="Include the tutorial videos"
            hint="Lists your published tutorials and adds a 'Watch the tutorials' button."
            disabled={!welcome.sendOnRegister}
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
          <input id="subject" type="text" required maxLength={150} value={welcome.subject} onChange={(e) => setWelcome({ ...welcome, subject: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label htmlFor="welcome-message" className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
          <textarea id="welcome-message" rows="6" required maxLength={3000} value={welcome.message} onChange={(e) => setWelcome({ ...welcome, message: e.target.value })} className={`${inputClass} resize-y`} />
          <p className="text-xs text-slate-400 mt-1">
            Type <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> to insert the vendor's name. {stats.welcomeNotSent} vendor(s) have not received this email yet.
          </p>
        </div>

        <div className="flex sm:justify-end">
          <button type="submit" disabled={savingWelcome} className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-60">
            <Save className="w-4 h-4 mr-2" /> {savingWelcome ? 'Saving...' : 'Save welcome email'}
          </button>
        </div>
      </form>

      {/* 2. MESSAGE TEMPLATES */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 flex items-center"><FileText className="w-5 h-5 mr-2 text-emerald-600" /> Message templates</h3>
          {tplEditing === null && (
            <button onClick={startNewTemplate} className="flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" /> New template
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">Write a message once, then send it whenever you need to: announcements, tips, feature updates.</p>

        {tplEditing !== null && (
          <form id="template-form" onSubmit={saveTemplate} className="mt-4 space-y-4 border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 sm:p-4 scroll-mt-4">
            <p className="text-sm font-bold text-slate-800">{tplEditing === 'new' ? 'New template' : 'Edit template'}</p>

            <div>
              <label htmlFor="tpl-name" className="block text-sm font-semibold text-slate-700 mb-1">Template name <span className="font-normal text-slate-400">(only you see this)</span></label>
              <input id="tpl-name" type="text" required maxLength={80} value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} className={inputClass} placeholder="e.g. New feature announcement" />
            </div>
            <div>
              <label htmlFor="tpl-subject" className="block text-sm font-semibold text-slate-700 mb-1">Email subject</label>
              <input id="tpl-subject" type="text" required maxLength={150} value={tplForm.subject} onChange={(e) => setTplForm({ ...tplForm, subject: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="tpl-message" className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
              <textarea id="tpl-message" rows="6" required maxLength={3000} value={tplForm.message} onChange={(e) => setTplForm({ ...tplForm, message: e.target.value })} className={`${inputClass} resize-y`} placeholder={'Hi {{name}},\n\n...'} />
              <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> for the vendor's name. {tplForm.message.length}/3000</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tpl-btn-label" className="block text-sm font-semibold text-slate-700 mb-1">Button label <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="tpl-btn-label" type="text" maxLength={40} value={tplForm.buttonLabel} onChange={(e) => setTplForm({ ...tplForm, buttonLabel: e.target.value })} className={inputClass} placeholder="e.g. Try it now" />
              </div>
              <div>
                <label htmlFor="tpl-btn-url" className="block text-sm font-semibold text-slate-700 mb-1">Button link <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="tpl-btn-url" type="text" inputMode="url" autoCapitalize="none" maxLength={500} value={tplForm.buttonUrl} onChange={(e) => setTplForm({ ...tplForm, buttonUrl: e.target.value })} className={inputClass} placeholder="/dashboard/products or https://..." />
              </div>
            </div>
            <p className="text-xs text-slate-400 -mt-2">A link starting with / opens that page in Vendira, for example /dashboard/store.</p>

            <Toggle
              checked={tplForm.includeTutorials}
              onChange={(v) => setTplForm({ ...tplForm, includeTutorials: v })}
              label="Include the tutorial videos by default"
              hint="You can still change this each time you send."
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button type="button" onClick={closeTemplateForm} className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
              <button type="submit" disabled={savingTpl} className="flex items-center justify-center px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-60">
                <Save className="w-4 h-4 mr-2" /> {savingTpl ? 'Saving...' : 'Save template'}
              </button>
            </div>
          </form>
        )}

        {templates.length === 0 && tplEditing === null ? (
          <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
            No templates yet. Create one to send announcements to your vendors.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {templates.map((t) => (
              <li key={t._id} className="border border-slate-100 rounded-xl p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 break-words">{t.name}</p>
                    <p className="text-sm text-slate-500 break-words">Subject: {t.subject}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">Sent to {t.sentCount || 0}</span>
                      {t.includeTutorials && <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">With tutorials</span>}
                      {t.buttonLabel && <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">Button: {t.buttonLabel}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => useTemplateToSend(t)} className="flex items-center text-sm font-bold text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg"><Send className="w-4 h-4 mr-1.5" /> Send</button>
                    <button onClick={() => startEditTemplate(t)} aria-label={`Edit ${t.name}`} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteTemplate(t)} aria-label={`Delete ${t.name}`} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. SEND A MESSAGE */}
      <div id="send-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4 scroll-mt-4">
        <h3 className="font-bold text-slate-900 flex items-center"><Users className="w-5 h-5 mr-2 text-emerald-600" /> Send a message</h3>
        <p className="text-sm text-slate-500 -mt-2">{stats.vendors} vendor(s) in total. Each click sends up to {stats.batchLimit} emails.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="send-template" className="block text-sm font-semibold text-slate-700 mb-1">Which message?</label>
            <select id="send-template" value={send.template} onChange={(e) => selectTemplate(e.target.value)} className={`${inputClass} bg-white`}>
              <option value="welcome">Welcome email (new users)</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="send-audience" className="block text-sm font-semibold text-slate-700 mb-1">Who gets it?</label>
            <select id="send-audience" value={send.audience} onChange={(e) => setSend({ ...send, audience: e.target.value })} className={`${inputClass} bg-white`}>
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {send.audience === 'latest' && (
          <div className="max-w-xs">
            <label htmlFor="send-count" className="block text-sm font-semibold text-slate-700 mb-1">How many of the newest sign-ups?</label>
            <input id="send-count" type="number" inputMode="numeric" min="1" max={stats.batchLimit} value={send.count} onChange={(e) => setSend({ ...send, count: e.target.value })} className={inputClass} />
          </div>
        )}
        {send.audience === 'recent' && (
          <div className="max-w-xs">
            <label htmlFor="send-days" className="block text-sm font-semibold text-slate-700 mb-1">Joined in the last how many days?</label>
            <input id="send-days" type="number" inputMode="numeric" min="1" max="90" value={send.days} onChange={(e) => setSend({ ...send, days: e.target.value })} className={inputClass} />
          </div>
        )}

        <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-4">
          <Toggle
            checked={withTutorials}
            onChange={(v) => setSend({ ...send, includeTutorials: v })}
            label="Include the tutorial videos"
            hint={noPublished ? 'No tutorials are published yet, so emails will go out without them.' : `${stats.publishedTutorials} published tutorial(s) are listed with a 'Watch the tutorials' button.`}
            disabled={noPublished}
          />
          <Toggle
            checked={send.skipAlreadySent}
            onChange={(v) => setSend({ ...send, skipAlreadySent: v })}
            label="Skip vendors who already received this message"
            hint={send.skipAlreadySent ? 'Nobody gets the same message twice.' : 'Resending: anyone emailed in the last 24 hours is still skipped.'}
          />
        </div>

        {/* Live count */}
        <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 p-3 sm:p-4 text-sm min-h-[3.5rem]">
          {preview.state === 'loading' && <span className="text-slate-500">Checking who would receive this...</span>}
          {preview.state === 'error' && <span className="text-red-600">{preview.message}</span>}
          {preview.state === 'ready' && p && (
            p.willSend === 0 ? (
              <span className="text-slate-600">
                No one to email with these settings.
                {p.alreadySent > 0 && ` ${p.alreadySent} already received it.`}
                {p.optedOut > 0 && ` ${p.optedOut} opted out of announcements.`}
              </span>
            ) : (
              <span className="text-slate-700">
                <strong className="text-slate-900">{p.willSend} vendor{p.willSend === 1 ? '' : 's'}</strong> will get this email
                {p.sample.length > 0 && <> (for example {p.sample.join(', ')})</>}.
                {p.alreadySent > 0 && <span className="text-slate-500"> {p.alreadySent} skipped: already received it.</span>}
                {p.optedOut > 0 && <span className="text-slate-500"> {p.optedOut} skipped: opted out.</span>}
                {p.eligible > p.willSend && <span className="text-amber-700"> Sending the first {p.willSend} now; click send again for the other {p.eligible - p.willSend}.</span>}
              </span>
            )
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={sendTest} disabled={Boolean(busy)} className="flex items-center justify-center px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-60">
            <Mail className="w-4 h-4 mr-2" /> {busy === 'test' ? 'Sending...' : 'Send me a test'}
          </button>
          <button
            type="button"
            onClick={sendMessage}
            disabled={Boolean(busy) || preview.state !== 'ready' || !p || p.willSend === 0}
            className="flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {busy === 'send' ? 'Sending...' : p && p.willSend > 0 ? `Send to ${p.willSend} vendor${p.willSend === 1 ? '' : 's'}` : 'Send'}
          </button>
        </div>
        <p className="text-xs text-slate-400 sm:text-right">Emails use the last saved version of the template. Save your changes first.</p>
      </div>

      {/* 4. TUTORIAL FORM */}
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

      {/* 5. TUTORIAL LIST */}
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
