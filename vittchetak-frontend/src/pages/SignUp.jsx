import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Building2, Shield, BarChart3, AtSign, ChevronDown, Lock } from 'lucide-react';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const BRANCHES = [
  'Mumbai North Regional Hub',
  'Bengaluru Tech Corridor',
  'Delhi Central Institutional',
  'Hyderabad Financial District',
  'Chennai Maritime Hub',
];

export default function SignUp() {
  const [form, setForm] = useState({ fullName: '', employeeId: '', branch: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.employeeId || !form.password) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      addToast('Account created! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-xl overflow-hidden shadow-2xl shadow-[#131e17]/5">
        
        {/* Left Visual Panel */}
        <div className="hidden md:flex md:col-span-5 relative bg-gradient-to-br from-[#006e2d]/90 to-[#1db954]/80 overflow-hidden flex-col justify-between p-12"
          style={{ backgroundImage: 'linear-gradient(rgba(0,110,45,0.85), rgba(29,185,84,0.75))' }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">VittChetak</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Cultivating <br />Financial <br />Clarity.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Join the institutional ecosystem where data lives, breathes, and informs smarter credit decisions.
            </p>
          </div>

          {/* Trust Overlay */}
          <div className="relative z-10 glass-effect p-6 rounded-xl border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-bold text-white">Institutional Trust Engine</span>
            </div>
            <p className="text-white/70 text-sm">
              End-to-end encrypted MSME portfolio analysis powered by proprietary growth-tracking algorithms.
            </p>
          </div>

          {/* Decorative grid */}
          <div
            className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }}
          />
        </div>

        {/* Right Form Panel */}
        <div className="col-span-1 md:col-span-7 p-8 md:p-16 flex flex-col justify-center">
          {/* Mobile branding */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <span className="text-xl font-black text-[#006e2d] tracking-tight">VittChetak</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-[#131e17] mb-2 tracking-tight">Create Institutional Account</h2>
            <p className="text-[#3d4a3d] font-medium">Empowering your branch with AI-driven foresight.</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-4 mb-12">
            {[
              { n: 1, label: 'Account Info', active: true },
              { n: 2, label: 'Verification', active: false },
              { n: 3, label: 'Security', active: false },
            ].map(({ n, label, active }) => (
              <div key={n} className={`flex items-center gap-2 ${!active ? 'opacity-40' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-[#006e2d] text-white' : 'bg-[#d9e6da] text-[#131e17]'}`}>{n}</div>
                <span className="text-xs font-bold text-[#131e17] font-headline uppercase tracking-wider">{label}</span>
                {n < 3 && <div className="h-[2px] w-8 bg-[#d9e6da] ml-2" />}
              </div>
            ))}
          </div>

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none"
                  placeholder="Dr. Aditi Sharma"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none"
                  placeholder="VC-998210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Bank Branch</label>
              <div className="relative">
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] appearance-none focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none"
                >
                  <option value="">Select Branch Location</option>
                  {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a3d] w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none pr-12"
                  placeholder="a.sharma@vittchetak.org"
                />
                <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a3d]/40 w-4 h-4" />
              </div>
              <p className="text-[10px] text-[#3d4a3d]/60 ml-1">Use your official institution email for verification.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none pr-12"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a3d]/40 w-4 h-4" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] text-sm font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* CTA */}
            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#006e2d] to-[#1db954] text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-[#006e2d]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
              <p className="text-center text-sm text-[#3d4a3d]">
                Already have an institutional account?{' '}
                <Link to="/login" className="text-[#006e2d] font-bold hover:underline">Sign In</Link>
              </p>
            </div>
          </form>

          {/* Footer Meta */}
          <div className="mt-12 pt-8 border-t border-[#dfece0] flex flex-wrap gap-6 justify-center md:justify-start">
            {[
              { icon: <Shield className="w-4 h-4 text-[#006e2d]" />, label: 'AES-256 Encrypted' },
              { icon: <Building2 className="w-4 h-4 text-[#006e2d]" />, label: 'Compliance Ready' },
              { icon: <BarChart3 className="w-4 h-4 text-[#006e2d]" />, label: 'Real-time Auditing' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                {icon}
                <span className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-tighter">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
