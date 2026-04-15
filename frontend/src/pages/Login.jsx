import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Badge, Lock, ArrowRight, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your credentials and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user || { name: data.name || email, role: data.role || 'Analyst' });
      addToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0fdf1] font-body text-[#131e17] min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-pattern opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#eaf7eb] via-[#f0fdf1] to-white opacity-90 pointer-events-none" />

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="bg-white rounded-xl p-10 shadow-[0_40px_80px_-15px_rgba(19,30,23,0.06)] border border-[#bccbb9]/10">
          {/* Branding Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-[#1db954]/10 rounded-full flex items-center justify-center mb-4 relative">
              <div className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center pulse-icon">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="font-headline font-extrabold text-3xl text-[#131e17] tracking-tight mb-1">VittChetak</h1>
            <p className="text-[#3d4a3d] font-medium text-sm">Institutional Financial Governance</p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-[#3d4a3d] ml-1" htmlFor="email">
                Email / Employee ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#3d4a3d]/60 group-focus-within:text-[#006e2d] transition-colors">
                  <Badge className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#d9e6da] border-none rounded-DEFAULT focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all text-[#131e17] placeholder:text-[#3d4a3d]/40 font-medium outline-none"
                  placeholder="Enter your credentials"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-[#3d4a3d]" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-[#006e2d] hover:text-[#004118] transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#3d4a3d]/60 group-focus-within:text-[#006e2d] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#d9e6da] border-none rounded-DEFAULT focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all text-[#131e17] placeholder:text-[#3d4a3d]/40 font-medium outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] text-sm font-semibold px-4 py-3 rounded-xl border border-[#ba1a1a]/10">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#006e2d] to-[#1db954] text-white font-headline font-bold py-4 rounded-full shadow-lg shadow-[#006e2d]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Secure Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 pt-8 border-t border-[#bccbb9]/10 text-center">
            <p className="text-[#3d4a3d] text-sm font-medium">
              New to the portal?{' '}
              <Link to="/signup" className="text-[#006e2d] font-bold ml-1 hover:underline underline-offset-4 decoration-2">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 opacity-60">
            <Shield className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#3d4a3d]">256-bit AES Encryption</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <UserCheck className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#3d4a3d]">Authorized Access Only</span>
          </div>
        </div>
      </main>

      {/* Decorative Bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-[#006e2d]/5 blur-[100px] rounded-[100%] pointer-events-none" />
    </div>
  );
}
