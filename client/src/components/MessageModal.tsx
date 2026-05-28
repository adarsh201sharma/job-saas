import { useEffect, useState } from 'react';
import { X, Copy, Check, Save, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Job, GeneratedMessages } from '../types';

const TABS = [
  { key: 'email',    label: 'Cold Email' },
  { key: 'linkedin', label: 'LinkedIn Note' },
  { key: 'referral', label: 'Referral' },
  { key: 'indeed',   label: 'Indeed Para' },
] as const;

type TabKey = typeof TABS[number]['key'];

function getContent(messages: GeneratedMessages, tab: TabKey): string {
  switch (tab) {
    case 'email':    return `Subject: ${messages.emailSubject}\n\n${messages.emailBody}`;
    case 'linkedin': return messages.linkedinNote;
    case 'referral': return messages.referralMessage;
    case 'indeed':   return messages.indeedPara;
  }
}

interface Props {
  job: Job;
  onClose(): void;
}

export default function MessageModal({ job, onClose }: Props) {
  const [messages, setMessages] = useState<GeneratedMessages | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('email');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.post<{ messages: GeneratedMessages }>('/messages/generate', {
      jobDescription: job.description,
      jobLink:        job.link,
      company:        job.company,
      role:           job.title,
      location:       job.location,
    })
      .then(({ data }) => setMessages(data.messages))
      .catch(err => {
        toast.error(err.response?.data?.error || 'Generation failed');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [job, onClose]);

  const copy = () => {
    if (!messages) return;
    navigator.clipboard.writeText(getContent(messages, activeTab));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveApplication = async () => {
    setSaving(true);
    try {
      await api.post('/messages/generate', {
        jobDescription:  job.description,
        jobLink:         job.link,
        company:         job.company,
        role:            job.title,
        location:        job.location,
        saveAsApplication: true,
      });
      toast.success('Saved to applications!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-lg leading-tight">{job.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Generating messages with AI...</p>
          </div>
        ) : messages && (
          <>
            <div className="flex gap-1 px-5 pt-4 border-b overflow-x-auto">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === t.key ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="relative bg-gray-50 rounded-lg p-4 min-h-[200px]">
                <button onClick={copy}
                  className="absolute top-2 right-2 text-xs bg-white border px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-50 shadow-sm">
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <pre className="whitespace-pre-wrap font-sans text-sm pr-16 leading-relaxed">
                  {getContent(messages, activeTab)}
                </pre>
                {activeTab === 'linkedin' && (
                  <div className={`text-xs mt-2 ${messages.linkedinNote.length > 280 ? 'text-red-600' : 'text-gray-500'}`}>
                    {messages.linkedinNote.length} / 300 chars
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 rounded-b-xl">
              <a href={job.link} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                View job posting
              </a>
              <button onClick={saveApplication} disabled={saving}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Save size={14} /> {saving ? 'Saving...' : 'Save to Applications'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { Wand2 };
