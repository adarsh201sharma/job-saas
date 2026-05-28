import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wand2, Search, Briefcase, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
      isActive ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="font-bold text-xl text-navy">JobJet 🚀</div>
          <div className="hidden md:flex gap-1">
            <NavLink to="/" className={link} end><LayoutDashboard size={16} /> Dashboard</NavLink>
            <NavLink to="/search" className={link}><Search size={16} /> Find Jobs</NavLink>
            <NavLink to="/linkedin" className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }>
              <span className="font-bold text-xs">in</span> LinkedIn
            </NavLink>
            <NavLink to="/generate" className={link}><Wand2 size={16} /> Generate</NavLink>
            <NavLink to="/applications" className={link}><Briefcase size={16} /> Applications</NavLink>
            <NavLink to="/profile" className={link}><User size={16} /> Profile</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">Hi, {user?.name}</span>
          <button onClick={() => { logout(); nav('/login'); }} className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
