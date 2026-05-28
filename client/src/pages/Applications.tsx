import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Application } from '../types';
import { Trash2, ExternalLink } from 'lucide-react';

const STATUSES = ['Saved', 'Applied', 'Referral Sent', 'Interview', 'Offer', 'Rejected', 'Ghosted'] as const;
type Status = typeof STATUSES[number];

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'All' | Status>('All');

  const load = () => api.get<Application[]>('/applications').then(r => setApps(r.data));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Status) => {
    const update: Record<string, unknown> = { status };
    if (status === 'Applied' || status === 'Referral Sent') update.appliedDate = new Date().toISOString();
    await api.patch(`/applications/${id}`, update);
    toast.success('Updated!');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    await api.delete(`/applications/${id}`);
    toast.success('Deleted');
    load();
  };

  const filtered = filter === 'All' ? apps : apps.filter(a => a.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Applications Tracker</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(['All', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${filter === s ? 'bg-navy text-white' : 'bg-white border'}`}>
            {s} {s !== 'All' && `(${apps.filter(a => a.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-gray-500">No applications yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app._id} className="card">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{app.role}</h3>
                  <div className="text-sm text-gray-600">{app.company} • {app.location || 'N/A'}</div>
                  {app.jobLink && (
                    <a href={app.jobLink} target="_blank" rel="noreferrer" className="text-xs text-accent flex items-center gap-1 mt-1">
                      <ExternalLink size={12} /> View posting
                    </a>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Added {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={app.status} onChange={e => updateStatus(app._id, e.target.value as Status)}
                    className="text-sm border rounded px-2 py-1">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => remove(app._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
