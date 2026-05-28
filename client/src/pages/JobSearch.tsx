import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MessageModal from '../components/MessageModal';
import { Job } from '../types';
import { Search, MapPin, Building, ExternalLink, Wand2 } from 'lucide-react';

export default function JobSearch() {
  const [query, setQuery] = useState('Full Stack Developer');
  const [location, setLocation] = useState('India');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post<{ jobs: Job[] }>('/jobs/search', { query, location, remoteOnly });
      setJobs(data.jobs);
      if (data.jobs.length === 0) toast('No jobs found, try different keywords');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Find Jobs</h1>

      <div className="card mb-6">
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <input className="input md:col-span-2" placeholder="Role / keyword (e.g. MERN developer)"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()} />
          <input className="input" placeholder="Location"
            value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
            Remote only
          </label>
          <button className="btn-primary flex items-center gap-2" onClick={search} disabled={loading}>
            <Search size={16} /> {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className="card">
            <div className="flex justify-between items-start mb-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  {job.source === 'LinkedIn' && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">LinkedIn</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1"><Building size={14} /> {job.company}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                  {job.remote && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">Remote</span>}
                </div>
              </div>
              <a href={job.link} target="_blank" rel="noreferrer" className="text-accent text-sm flex items-center gap-1 whitespace-nowrap">
                <ExternalLink size={14} /> View
              </a>
            </div>
            {job.salary && <div className="text-sm text-gray-700 mb-2">💰 {job.salary}</div>}
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{job.description}</p>
            <button onClick={() => setSelectedJob(job)} className="btn-primary text-sm flex items-center gap-2">
              <Wand2 size={14} /> Generate Messages
            </button>
          </div>
        ))}
      </div>

      {!loading && jobs.length === 0 && (
        <div className="card text-center text-gray-500">
          <p>Enter a search to find jobs.</p>
          <p className="text-xs mt-2">Powered by LinkedIn + JSearch (Indeed, Glassdoor & more)</p>
        </div>
      )}

      {selectedJob && <MessageModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
