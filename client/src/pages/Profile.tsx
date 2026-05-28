import { useEffect, useRef, useState, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Profile as ProfileType } from '../types';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [techStack, setTechStack] = useState('');
  const [achievements, setAchievements] = useState('');
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<ProfileType>('/profile').then(r => {
      setProfile(r.data);
      setTechStack((r.data.techStack || []).join(', '));
      setAchievements((r.data.keyAchievements || []).join('\n'));
    });
  }, []);

  const save = async () => {
    if (!profile) return;
    const payload = {
      ...profile,
      techStack:       techStack.split(',').map(s => s.trim()).filter(Boolean),
      keyAchievements: achievements.split('\n').map(s => s.trim()).filter(Boolean),
    };
    await api.put('/profile', payload);
    toast.success('Profile saved!');
  };

  const handleResumeUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return; }

    setParsing(true);
    const toastId = toast.loading('Parsing resume...');
    try {
      const form = new FormData();
      form.append('resume', file);
      const { data } = await api.post<ProfileType & { techStack: string[]; keyAchievements: string[] }>(
        '/profile/parse-resume', form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      setProfile(prev => prev ? ({
        ...prev,
        fullName:        data.fullName        || prev.fullName,
        phone:           data.phone           || prev.phone,
        location:        data.location        || prev.location,
        linkedinUrl:     data.linkedinUrl     || prev.linkedinUrl,
        githubUrl:       data.githubUrl       || prev.githubUrl,
        currentRole:     data.currentRole     || prev.currentRole,
        currentCompany:  data.currentCompany  || prev.currentCompany,
        yearsExperience: data.yearsExperience || prev.yearsExperience,
        resumeSummary:   data.resumeSummary   || prev.resumeSummary,
      }) : prev);

      if (data.techStack?.length)       setTechStack(data.techStack.join(', '));
      if (data.keyAchievements?.length) setAchievements(data.keyAchievements.join('\n'));

      toast.success('Resume parsed! Review and save.', { id: toastId });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to parse resume', { id: toastId });
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!profile) return <div>Loading...</div>;

  const update = (key: keyof ProfileType, val: string | number) =>
    setProfile(prev => prev ? { ...prev, [key]: val } : prev);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => fileRef.current?.click()} disabled={parsing}>
          {parsing ? 'Parsing...' : 'Upload Resume (PDF)'}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
      </div>
      <p className="text-gray-600 text-sm mb-6">This information powers AI-generated messages — fill it thoroughly for best results.</p>

      <div className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          {([
            ['fullName', 'Full Name', 'text'],
            ['phone', 'Phone', 'text'],
            ['location', 'Location', 'text'],
            ['yearsExperience', 'Years of Experience', 'number'],
            ['currentRole', 'Current Role', 'text'],
            ['currentCompany', 'Current Company', 'text'],
            ['linkedinUrl', 'LinkedIn URL', 'text'],
            ['githubUrl', 'GitHub URL', 'text'],
          ] as [keyof ProfileType, string, string][]).map(([key, label, type]) => (
            <div key={key}>
              <label className="text-sm font-medium">{label}</label>
              <input className="input" type={type}
                value={(profile[key] as string | number) ?? ''}
                onChange={e => update(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium">Tech Stack (comma-separated)</label>
          <input className="input" placeholder="Node.js, React, MongoDB, ..." value={techStack} onChange={e => setTechStack(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Resume Summary</label>
          <textarea className="input min-h-[120px]" placeholder="2-3 line professional summary..."
            value={profile.resumeSummary ?? ''} onChange={e => update('resumeSummary', e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Key Achievements (one per line)</label>
          <textarea className="input min-h-[150px]" placeholder="Built X that did Y..."
            value={achievements} onChange={e => setAchievements(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={save}>Save Profile</button>
      </div>
    </div>
  );
}
