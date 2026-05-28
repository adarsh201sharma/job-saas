import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { GeneratedMessages } from '../types';
import { Wand2, Copy, Check, Save, Link, FileText } from 'lucide-react';

const MSG_TABS = [
  { key: 'email',    label: 'Cold Email' },
  { key: 'linkedin', label: 'LinkedIn Note' },
  { key: 'referral', label: 'Referral' },
  { key: 'indeed',   label: 'Indeed Para' },
] as const;

type TabKey = typeof MSG_TABS[number]['key'];

interface ManualForm {
  jobDescription: string;
  jobLink: string;
  company: string;
  role: string;
  location: string;
}

interface GeneratePayload extends ManualForm {
  saveAsApplication?: boolean;
}

export default function Generator() {
  const [inputMode, setInputMode] = useState<'manual' | 'linkedin'>('manual');
  const [form, setForm] = useState<ManualForm>({ jobDescription: '', jobLink: '', company: '', role: '', location: '' });
  const [liUrl, setLiUrl] = useState('');
  const [messages, setMessages] = useState<GeneratedMessages | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('email');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async (payload: GeneratePayload, save = false) => {
    setLoading(true);
    try {
      const { data } = await api.post<{ messages: GeneratedMessages; application?: unknown }>(
        '/messages/generate', { ...payload, saveAsApplication: save },
      );
      setMessages(data.messages);
      if (save && data.application) toast.success('Saved to applications!');
      else toast.success('Messages generated!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Generation failed');
    } finally { setLoading(false); }
  };

  const handleManualGenerate = (save = false) => {
    if (!form.jobDescription.trim()) return toast.error('Paste a job description first');
    generate(form, save);
  };

  const handleLinkedInGenerate = async (save = false) => {
    if (!liUrl.trim()) return toast.error('Paste a LinkedIn job URL first');
    if (!liUrl.includes('linkedin.com')) return toast.error('URL must be a LinkedIn job link');
    setLoading(true);
    const toastId = toast.loading('Scraping job description...');
    try {
      const { data: scraped } = await api.post<{ description: string; title?: string; company?: string; location?: string }>(
        '/jobs/scrape', { url: liUrl },
      );
      if (!scraped.description) {
        toast.error('Could not scrape description — try the manual tab', { id: toastId });
        setLoading(false);
        return;
      }
      toast.success('Scraped! Generating messages...', { id: toastId });
      await generate({
        jobDescription: scraped.description,
        jobLink:        liUrl,
        company:        scraped.company  || '',
        role:           scraped.title    || '',
        location:       scraped.location || '',
      }, save);
    } catch {
      toast.error('Scrape failed', { id: toastId });
      setLoading(false);
    }
  };

  const scrapeToManual = async () => {
    if (!form.jobLink) return toast.error('Enter a URL first');
    const toastId = toast.loading('Scraping...');
    try {
      const { data } = await api.post<{ description: string; title?: string; company?: string; location?: string }>(
        '/jobs/scrape', { url: form.jobLink },
      );
      setForm(f => ({ ...f, jobDescription: data.description, company: data.company || f.company, role: data.title || f.role, location: data.location || f.location }));
      toast.success('Scraped!', { id: toastId });
    } catch {
      toast.error('Scrape failed', { id: toastId });
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveContent = (): string => {
    if (!messages) return '';
    switch (activeTab) {
      case 'email':    return `Subject: ${messages.emailSubject}\n\n${messages.emailBody}`;
      case 'linkedin': return messages.linkedinNote;
      case 'referral': return messages.referralMessage;
      case 'indeed':   return messages.indeedPara;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Generate Messages</h1>

      <div className="flex gap-1 mb-4">
        <button onClick={() => setInputMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'manual' ? 'bg-navy text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          <FileText size={15} /> Paste JD
        </button>
        <button onClick={() => setInputMode('linkedin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'linkedin' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          <Link size={15} /> LinkedIn URL
        </button>
      </div>

      {inputMode === 'manual' && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Job Details</h2>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <input className="input" placeholder="Company"  value={form.company}  onChange={e => setForm({ ...form, company: e.target.value })} />
            <input className="input" placeholder="Role"     value={form.role}     onChange={e => setForm({ ...form, role: e.target.value })} />
            <input className="input" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" placeholder="Job URL (optional)" value={form.jobLink} onChange={e => setForm({ ...form, jobLink: e.target.value })} />
            <button className="btn-secondary whitespace-nowrap" onClick={scrapeToManual}>Scrape URL</button>
          </div>
          <textarea className="input min-h-[200px] font-mono text-sm" placeholder="Paste the full job description..."
            value={form.jobDescription} onChange={e => setForm({ ...form, jobDescription: e.target.value })} />
          <div className="flex gap-3 mt-4">
            <button className="btn-primary flex items-center gap-2" onClick={() => handleManualGenerate(false)} disabled={loading}>
              <Wand2 size={16} /> {loading ? 'Generating...' : 'Generate Messages'}
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={() => handleManualGenerate(true)} disabled={loading}>
              <Save size={16} /> Generate & Save
            </button>
          </div>
        </div>
      )}

      {inputMode === 'linkedin' && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">in</div>
            <h2 className="font-semibold">LinkedIn Job URL</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Paste any LinkedIn job posting URL — description is scraped automatically.</p>
          <input className="input mb-4" placeholder="https://www.linkedin.com/jobs/view/..."
            value={liUrl} onChange={e => setLiUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLinkedInGenerate(false)} />
          <div className="flex gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              onClick={() => handleLinkedInGenerate(false)} disabled={loading}>
              <Wand2 size={16} /> {loading ? 'Scraping & Generating...' : 'Generate Messages'}
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={() => handleLinkedInGenerate(true)} disabled={loading}>
              <Save size={16} /> Generate & Save
            </button>
          </div>
        </div>
      )}

      {messages && (
        <div className="card">
          <div className="flex gap-2 border-b pb-3 mb-4 overflow-x-auto">
            {MSG_TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === t.key ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative bg-gray-50 rounded-lg p-4">
            <button onClick={() => copyText(getActiveContent())}
              className="absolute top-2 right-2 text-xs bg-white border px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-50">
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <pre className="whitespace-pre-wrap font-sans text-sm pr-16">{getActiveContent()}</pre>
            {activeTab === 'linkedin' && messages.linkedinNote && (
              <div className={`text-xs mt-2 ${messages.linkedinNote.length > 280 ? 'text-red-600' : 'text-gray-500'}`}>
                {messages.linkedinNote.length} / 300 chars
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
