import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Application, StatsResponse } from '../types';
import { Briefcase, Send, CheckCircle, XCircle, Clock, Sparkles, Search } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse>({ total: 0, byStatus: [] });
  const [recent, setRecent] = useState<Application[]>([]);

  useEffect(() => {
    api.get<StatsResponse>('/applications/stats/summary').then(r => setStats(r.data)).catch(() => {});
    api.get<Application[]>('/applications').then(r => setRecent(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const getCount = (status: string) => stats.byStatus.find(s => s._id === status)?.count ?? 0;

  const cards = [
    { label: 'Total',     count: stats.total,           icon: Briefcase,    color: 'bg-blue-50 text-blue-700' },
    { label: 'Applied',   count: getCount('Applied'),   icon: Send,         color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Interview', count: getCount('Interview'), icon: Clock,        color: 'bg-green-50 text-green-700' },
    { label: 'Offer',     count: getCount('Offer'),     icon: CheckCircle,  color: 'bg-purple-50 text-purple-700' },
    { label: 'Rejected',  count: getCount('Rejected'),  icon: XCircle,      color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card">
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold">{c.count}</div>
              <div className="text-sm text-gray-600">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link to="/search" className="card hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700">
            <Search size={22} />
          </div>
          <div>
            <div className="font-semibold">Find Jobs</div>
            <div className="text-sm text-gray-600">Search across LinkedIn, Indeed & more</div>
          </div>
        </Link>
        <Link to="/generate" className="card hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-700">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="font-semibold">Generate Messages</div>
            <div className="text-sm text-gray-600">AI-tailored emails, notes, referrals</div>
          </div>
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Applications</h2>
      <div className="card">
        {recent.length === 0 ? (
          <p className="text-gray-500 text-sm">No applications yet. Start by <Link to="/search" className="text-accent">finding a job</Link>.</p>
        ) : (
          <div className="divide-y">
            {recent.map(app => (
              <div key={app._id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{app.role}</div>
                  <div className="text-sm text-gray-600">{app.company} • {app.location}</div>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">{app.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
