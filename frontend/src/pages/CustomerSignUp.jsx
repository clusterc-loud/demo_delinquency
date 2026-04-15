import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Building2, Shield, BarChart3, AtSign, ChevronDown, Lock, User } from 'lucide-react';
import { useToast } from '../components/Toast';
import api from '../api/axios';

export default function CustomerSignUp() {
  const [form, setForm] = useState({ name: '', email: '', password: '', customerType: 'RETAIL', businessName: '', gstNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/customer/register', form);
      addToast('Account created! Welcome to VittChetak.', 'success');
      navigate('/customer-login');
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
              Your Financial <br />Health, <br />Demystified.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Discover exactly where your credit stands and how to improve it, automatically.
            </p>
          </div>

          {/* Trust Overlay */}
          <div className="relative z-10 glass-effect p-6 rounded-xl border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-bold text-white">Bank-Grade Security</span>
            </div>
            <p className="text-white/70 text-sm">
              We employ military-grade encryption to safeguard your retail and business analytics.
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
            <h2 className="text-3xl font-extrabold text-[#131e17] mb-2 tracking-tight">Unlock Your Dashboard</h2>
            <p className="text-[#3d4a3d] font-medium">Join thousands tracking their credit proactively.</p>
          </div>

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-1">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="radio" name="customerType" value="RETAIL" checked={form.customerType === 'RETAIL'} onChange={handleChange} className="w-4 h-4 text-[#006e2d] focus:ring-[#006e2d]" />
                  Retail Customer
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="radio" name="customerType" value="MSME" checked={form.customerType === 'MSME'} onChange={handleChange} className="w-4 h-4 text-[#006e2d] focus:ring-[#006e2d]" />
                  MSME Business
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none"
                      placeholder="Jane Doe"
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a3d]/40 w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none pr-12"
                      placeholder="jane@example.com"
                    />
                    <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a3d]/40 w-4 h-4" />
                  </div>
                </div>
              </div>

              {form.customerType === 'MSME' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none"
                      placeholder="Jane Enterprises"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#3d4a3d] uppercase tracking-widest ml-1">GSTIN Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={form.gstNumber}
                      onChange={handleChange}
                      className="w-full bg-[#dfece0] border-none rounded-xl p-4 text-[#131e17] placeholder:text-[#3d4a3d]/50 focus:ring-2 focus:ring-[#006e2d]/20 focus:bg-white transition-all outline-none"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
              )}

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
                  className="w-full bg-[#131e17] text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-[#131e17]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering...</>
                  ) : (
                    <>Create My Account <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
                <p className="text-center text-sm text-[#3d4a3d]">
                  Already registered?{' '}
                  <Link to="/customer-login" className="text-[#006e2d] font-bold hover:underline">Sign In</Link>
                </p>
              </div>
            </div>
          </form>

          {/* Footer Meta */}
          <div className="mt-12 pt-8 border-t border-[#dfece0] flex flex-wrap gap-6 justify-center md:justify-start">
            {[
              { icon: <Shield className="w-4 h-4 text-[#006e2d]" />, label: 'Guaranteed Safe' },
              { icon: <Building2 className="w-4 h-4 text-[#006e2d]" />, label: 'Fast Setup' },
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
