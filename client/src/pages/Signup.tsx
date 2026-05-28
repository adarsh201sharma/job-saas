import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Complete your profile.');
      nav('/profile');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-navy">JobJet 🚀</h1>
        <p className="text-gray-600 mt-2">AI-powered job application assistant</p>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Create account</h2>
        <form onSubmit={submit} className="space-y-4">
          <input className="input" type="text" placeholder="Full name" required
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password (min 6 chars)" minLength={6} required
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-gray-600">
          Have an account? <Link to="/login" className="text-accent font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
