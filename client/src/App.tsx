import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import JobSearch from './pages/JobSearch';
import LinkedInSearch from './pages/LinkedInSearch';
import Applications from './pages/Applications';
import Profile from './pages/Profile';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login"        element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup"       element={user ? <Navigate to="/profile" /> : <Signup />} />
          <Route path="/"             element={<Protected><Dashboard /></Protected>} />
          <Route path="/generate"     element={<Protected><Generator /></Protected>} />
          <Route path="/search"       element={<Protected><JobSearch /></Protected>} />
          <Route path="/linkedin"     element={<Protected><LinkedInSearch /></Protected>} />
          <Route path="/applications" element={<Protected><Applications /></Protected>} />
          <Route path="/profile"      element={<Protected><Profile /></Protected>} />
        </Routes>
      </main>
    </div>
  );
}
