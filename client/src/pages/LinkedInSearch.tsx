import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MessageModal from '../components/MessageModal';
import { Job } from '../types';
import { Search, MapPin, Building, ExternalLink, Wand2, Clock, ChevronDown } from 'lucide-react';

const DATE_OPTIONS = [
  { label: 'Any time',      value: '' },
  { label: 'Past 24 hours', value: '24hr' },
  { label: 'Past week',     value: 'past week' },
  { label: 'Past month',    value: 'past month' },
  { label: 'Custom',        value: 'custom' },
];

const FILTERS = {
  experienceLevel: [
    { label: 'Any level',        value: '' },
    { label: 'Internship',       value: 'internship' },
    { label: 'Entry level',      value: 'entry level' },
    { label: 'Associate',        value: 'associate' },
    { label: 'Mid-Senior level', value: 'mid-senior level' },
    { label: 'Director',         value: 'director' },
    { label: 'Executive',        value: 'executive' },
  ],
  jobType: [
    { label: 'Any type',   value: '' },
    { label: 'Full-time',  value: 'full time' },
    { label: 'Part-time',  value: 'part time' },
    { label: 'Contract',   value: 'contract' },
    { label: 'Temporary',  value: 'temporary' },
    { label: 'Internship', value: 'internship' },
    { label: 'Volunteer',  value: 'volunteer' },
  ],
  remoteFilter: [
    { label: 'Any workplace', value: '' },
    { label: 'On-site',       value: 'on-site' },
    { label: 'Remote',        value: 'remote' },
    { label: 'Hybrid',        value: 'hybrid' },
  ],
  sortBy: [
    { label: 'Most recent',   value: 'recent' },
    { label: 'Most relevant', value: 'relevant' },
  ],
};

interface FilterPillsProps {
  label: string;
  options: { label: string; value: string }[];
  value: string | string[];
  onChange(v: string | string[]): void;
  multi?: boolean;
}

function FilterPills({ label, options, value, onChange, multi = false }: FilterPillsProps) {
  if (multi) {
    const arr = value as string[];
    const toggle = (val: string) => {
      if (val === '') { onChange([]); return; }
      onChange(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    };
    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                opt.value === ''
                  ? arr.length === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  : arr.includes(opt.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const str = value as string;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              str === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Filters {
  dateSincePosted: string;
  customValue: string;
  customUnit: 'seconds' | 'hours' | 'days';
  experienceLevel: string[];
  jobType: string[];
  remoteFilter: string[];
  sortBy: string;
}

const UNIT_SECONDS: Record<string, number> = { seconds: 1, hours: 3600, days: 86400 };

export default function LinkedInSearch() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState<Filters>({
    dateSincePosted: 'past week',
    customValue: '',
    customUnit: 'days',
    experienceLevel: [],
    jobType: [],
    remoteFilter: [],
    sortBy: 'recent',
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters(f => ({ ...f, [key]: val }));

  const getEffectiveDateFilter = (): string => {
    if (filters.dateSincePosted === 'custom') {
      const val = parseInt(filters.customValue);
      if (isNaN(val) || val <= 0) return '';
      return String(val * UNIT_SECONDS[filters.customUnit]);
    }
    return filters.dateSincePosted;
  };

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post<{ jobs: Job[] }>('/jobs/linkedin', {
        query, location,
        dateSincePosted:  getEffectiveDateFilter(),
        experienceLevel:  filters.experienceLevel,
        jobType:          filters.jobType,
        remoteFilter:     filters.remoteFilter,
        sortBy:           filters.sortBy,
      });
      setJobs(data.jobs);
      if (data.jobs.length === 0) toast('No jobs found — try different keywords or filters');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">in</div>
        <h1 className="text-2xl font-bold">LinkedIn Job Search</h1>
      </div>

      <div className="card mb-4">
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Job title, keywords, or company"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()} />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="City, state, or country"
              value={location} onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button className="text-sm text-gray-600 flex items-center gap-1 hover:text-blue-600"
            onClick={() => setShowFilters(f => !f)}>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            onClick={search} disabled={loading}>
            <Search size={16} /> {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date posted</p>
            <div className="flex flex-wrap gap-2 items-center">
              {DATE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFilter('dateSincePosted', opt.value)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    filters.dateSincePosted === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
              {filters.dateSincePosted === 'custom' && (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" className="input w-24 text-sm py-1" placeholder="Value"
                    value={filters.customValue} onChange={e => setFilter('customValue', e.target.value)} />
                  <select className="input w-28 text-sm py-1" value={filters.customUnit}
                    onChange={e => setFilter('customUnit', e.target.value as Filters['customUnit'])}>
                    <option value="seconds">Seconds</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                  <span className="text-sm text-gray-400">ago</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <FilterPills label="Experience level" options={FILTERS.experienceLevel} value={filters.experienceLevel} onChange={v => setFilter('experienceLevel', v as string[])} multi />
            <FilterPills label="Job type"         options={FILTERS.jobType}          value={filters.jobType}          onChange={v => setFilter('jobType', v as string[])} multi />
            <FilterPills label="Workplace type"   options={FILTERS.remoteFilter}     value={filters.remoteFilter}     onChange={v => setFilter('remoteFilter', v as string[])} multi />
            <FilterPills label="Sort by"          options={FILTERS.sortBy}           value={filters.sortBy}           onChange={v => setFilter('sortBy', v as string)} />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div className="flex gap-3">
                {job.companyLogo
                  ? <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded object-contain border border-gray-100 flex-shrink-0" />
                  : <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">{job.company?.[0] ?? '?'}</div>
                }
                <div>
                  <h3 className="font-semibold text-base leading-tight">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1"><Building size={13} />{job.company}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>
                    {job.agoTime && <span className="flex items-center gap-1"><Clock size={13} />{job.agoTime}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {job.remote && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs border border-green-200">Remote</span>}
                    {job.employmentType && <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full text-xs border border-gray-200 capitalize">{job.employmentType}</span>}
                  </div>
                </div>
              </div>
              <a href={job.link} target="_blank" rel="noreferrer"
                className="text-blue-600 text-sm flex items-center gap-1 whitespace-nowrap hover:underline flex-shrink-0">
                <ExternalLink size={14} /> View
              </a>
            </div>
            {job.description && <p className="text-sm text-gray-600 line-clamp-3 mt-2 mb-3">{job.description}</p>}
            <button onClick={() => setSelectedJob(job)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <Wand2 size={14} /> Generate Messages
            </button>
          </div>
        ))}
      </div>

      {!loading && jobs.length === 0 && (
        <div className="card text-center text-gray-500 py-10">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">Search LinkedIn jobs</p>
          <p className="text-sm mt-1 text-gray-400">Use the filters above to narrow by experience, job type, and more</p>
        </div>
      )}

      {selectedJob && <MessageModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
