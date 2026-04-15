import React from 'react';
import { Search, Bell, Settings, ArrowRight, HelpCircle, Wallet, MessageSquare, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RetailDashboard({ data, loading, onHelpSelect }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/customer-login');
  };

  if (loading || !data) return <div className="p-8 text-on-surface">Loading...</div>;

  return (
    <div className="flex min-h-screen overflow-hidden bg-surface text-on-background">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-full py-6 bg-emerald-50 dark:bg-emerald-950 w-64 border-r-0 font-['Plus_Jakarta_Sans'] font-medium antialiased shrink-0 min-h-screen">
        <div className="px-8 mb-10">
          <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-50 tracking-tight">VittChetak</h1>
          <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold mt-1">Premium Growth Tier</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {/* Active Tab: Dashboard */}
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-green-700 dark:text-green-300 font-bold border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" href="#">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>EMI Transactions</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" href="#">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span>Financial Health</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" href="#">
            <span className="material-symbols-outlined">help_center</span>
            <span>Support</span>
          </a>
        </nav>
        <div className="mt-auto px-4 pb-4">
          <button className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-primary text-on-primary rounded-lg font-bold text-sm shadow-xl shadow-primary/10 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            AI Insights
          </button>
          <div className="mt-6 px-4 flex items-center gap-3">
            <img alt="User profile photo" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt530Pm_OOXTQ2YTDeTI1SvWDHvy_c30n2kP0Yd7Yv_PCdTbFPKc4DUkc6-pgWSbrkouskKfTAJ5D1wfyoLUf99pJjMsZlMv8G3BtWeoxZTUW4rSnWOA9L_FQjzgEF_2MS2wRYJBdXA5Y1t0AWoLcBbe3m2TNSQpXrXBpoQ_TRmA2lo58qB4lN76tRu1beHuURqvRmeb5Q06_jFG_I4hqAMnqPysu6rk2gvmfGrhZk3TC5kEwpcALQRRvQvTVPVWij_tE8-Km7wQ"/>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{data.name}</p>
              <p className="text-[10px] text-on-surface-variant">Growth Member</p>
            </div>
          </div>
          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 text-emerald-800/70 dark:text-emerald-200/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-green-600 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-bold"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface relative">
        {/* Top Bar */}
        <header className="flex justify-between items-center w-full px-8 py-3 bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 transition-all font-['Plus_Jakarta_Sans'] text-sm">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
              <input className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-on-surface-variant/60" placeholder="Search transactions or tools..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hover:bg-white/50 dark:hover:bg-black/20 rounded-full p-2 text-on-surface-variant">
              <Bell className="w-5 h-5" />
            </button>
            <button className="hover:bg-white/50 dark:hover:bg-black/20 rounded-full p-2 text-on-surface-variant">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
            <img alt="User avatar" className="w-8 h-8 rounded-full border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtTJ23MDex2bCgpwE7AeG44iS3OkUEa-77kOeGBG_XvyoiJomQ59O-3kBu4c_hYo0Aq8ODiC8-1f9fvBsJFZLmbwyMvmKRyvqIPXzH2EiDsnazIA0xuF0M5YcPs8oxwI-_hAWx2Ppe4JfYhhE246FvPN230s6uzfDjAgTii23ZcSBgzirjPofcHUKXonWORPe_0U2A5mFNn7kXLmrf-9c_usryhzZ6z_y8K6Ty9lMwgWEEmIhuiPVmVtPS4z1MxvtbZHirJcG6Sg"/>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Hero Section (Bento Grid Style) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Welcome Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-lg p-8 text-on-primary flex flex-col justify-between min-h-[240px] relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome back, {data.name?.split(' ')[0]}</h2>
                <p className="text-on-primary/80 max-w-md">Your financial growth is on a steady trajectory. You've successfully cleared 4 EMIs this quarter.</p>
              </div>
              <div className="relative z-10 flex gap-12 mt-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-primary/60 font-bold">Total Active Loans</p>
                  <p className="text-4xl font-bold mt-1">₹4,20,000</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-primary/60 font-bold">Next Due</p>
                  <p className="text-4xl font-bold mt-1">Oct 12</p>
                </div>
              </div>
              {/* Aesthetic Glass Circle Decoration */}
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Financial Health Card */}
            <div className="bg-surface-container-lowest rounded-lg p-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Financial Health Score</p>
              <div className="relative flex items-center justify-center mb-4">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle className="fill-none stroke-surface-container stroke-[8]" cx="50" cy="50" r="40"></circle>
                  <circle className="fill-none stroke-primary-container stroke-[8]" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`calc(251.2 - (251.2 * ${data.score}) / 100)`} cx="50" cy="50" r="40"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-primary">{Math.round(data.score * 8.5) || 82}</span>
                </div>
              </div>
              <div className="bg-primary-fixed px-3 py-1 rounded-full mb-3">
                <span className="text-[10px] font-bold text-on-primary-fixed uppercase tracking-wider">{data.band ? data.band.replace('_', ' ') : 'Excellent'}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                <span className="font-bold text-primary">AI Insight: </span> 
                {data.summaryText || 'Your debt-to-income ratio improved by 4% this month. Keep it up!'}
              </p>
            </div>
          </section>

          {/* EMI Transaction Logs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-on-surface">EMI Transaction Logs</h3>
              <button className="text-primary text-sm font-bold flex items-center gap-1">
                View Statement <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-surface-container-low rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 px-8 py-4 border-b border-outline-variant/10 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <div>Date</div>
                <div>Description</div>
                <div>Amount</div>
                <div className="text-right">Status</div>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {[
                  { date: 'Sep 12, 2023', desc: 'Home Loan EMI #24', amount: '₹24,500', status: 'Paid' },
                  { date: 'Aug 12, 2023', desc: 'Home Loan EMI #23', amount: '₹24,500', status: 'Paid' },
                  { date: 'Jul 12, 2023', desc: 'Personal Loan EMI #06', amount: '₹8,200', status: 'Paid' },
                  { date: 'Oct 12, 2023', desc: 'Home Loan EMI #25', amount: '₹24,500', status: 'Pending' }
                ].map((txn, idx) => (
                  <div key={idx} className="grid grid-cols-4 px-8 py-5 items-center hover:bg-surface-container-high transition-colors">
                    <div className="text-sm text-on-surface">{txn.date}</div>
                    <div className="text-sm font-medium text-on-surface">{txn.desc}</div>
                    <div className="text-sm font-bold text-on-surface">{txn.amount}</div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${txn.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-tertiary-fixed text-on-tertiary-container'}`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold tracking-tight text-on-surface">Support & Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FAQ Card 1 */}
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-primary mb-4">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-on-surface mb-2">Can I prepay my EMI?</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Prepayments are available after the first 6 months of your loan tenure with zero penalties.</p>
              </div>
              {/* FAQ Card 2 */}
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-primary mb-4">
                  <Wallet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-on-surface mb-2">Change Repayment Bank</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Switch your primary repayment account by updating your NACH mandate in the settings.</p>
              </div>
              {/* Chat with Agent Card */}
              <div className="bg-surface-container-low p-6 rounded-lg flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-on-surface mb-2">Need direct help?</h4>
                  <p className="text-xs text-on-surface-variant mb-4">Our financial advisors are available 24/7 to assist with complex queries.</p>
                </div>
                <button onClick={onHelpSelect} className="w-full py-3 bg-secondary text-on-secondary rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90">
                  <MessageSquare className="w-4 h-4" />
                  Chat with Agent
                </button>
              </div>
            </div>
          </section>
        </div>
        {/* Footer spacing */}
        <div className="h-12"></div>
      </main>
    </div>
  );
}
