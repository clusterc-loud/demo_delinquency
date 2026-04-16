import React from 'react';
import { Activity, Bell, Settings, Search, Download, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MSMEDashboard({ data, loading, onHelpSelect, onSimulate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/customer-login');
  };

  if (loading || !data) return <div className="p-8 text-on-surface">Loading...</div>;

  return (
    <div className="bg-background text-on-background antialiased flex overflow-hidden min-h-screen">
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-full py-6 bg-emerald-50 dark:bg-emerald-950 w-64 border-r-0 font-['Plus_Jakarta_Sans'] font-medium antialiased shrink-0">
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-50 tracking-tight">VittChetak</h1>
          <p className="text-xs text-green-600 font-semibold uppercase tracking-widest mt-1">Premium Growth Tier</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-700 dark:text-green-300 font-bold border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" href="#">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>EMI Transactions</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" href="#">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span>Financial Health</span>
          </a>
        </nav>
        <div className="px-4 mt-auto">
          <div className="mt-6 flex items-center gap-3 px-2">
            <img alt="User profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt530Pm_OOXTQ2YTDeTI1SvWDHvy_c30n2kP0Yd7Yv_PCdTbFPKc4DUkc6-pgWSbrkouskKfTAJ5D1wfyoLUf99pJjMsZlMv8G3BtWeoxZTUW4rSnWOA9L_FQjzgEF_2MS2wRYJBdXA5Y1t0AWoLcBbe3m2TNSQpXrXBpoQ_TRmA2lo58qB4lN76tRu1beHuURqvRmeb5Q06_jFG_I4hqAMnqPysu6rk2gvmfGrhZk3TC5kEwpcALQRRvQvTVPVWij_tE8-Km7wQ"/>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{data.name}</p>
              <p className="text-[10px] opacity-70 truncate">{data.businessName || 'MSME Enterprise'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-4 text-emerald-800/70 dark:text-emerald-200/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-green-600 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-bold">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-8 py-3 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input className="w-full bg-surface-container-high border-none rounded-full py-2 pl-10 pr-4 text-sm" placeholder="Search insights..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <img alt="Business avatar" className="w-8 h-8 rounded-lg object-cover border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_N5mvZRMRdMOkGKOuyNZrO-IekUnOTlpbRDbG5PQ5NUFGiASH5WyEdSg1M1Kr5aw_X2QAxENV-26Fg65z_BFlwrmBqexNpRsMBA3hSHePMEd9Cy6FcbCaEOYhYvzltqeyfKlyBR9get7Wdeggi_SLcQdVp2x9I42NyUk4bYmrDJXj3dzNcCitGjexzMu4xSHwVCjmPUQX2aafeJdQfqgJ1tiLa8E_63WfRyKC0lGyPQf7_xUa17BZIgj0XQ2I9o6VBrN2rX5C5g"/>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8">
          {/* Proactive Risk Alert */}
          {(data.score < 50 || (data.emiSchedule && data.emiSchedule.some(e => e.status === 'OVERDUE'))) && (
            <div className="bg-[#ffdad6] border-[1.5px] border-[#ba1a1a]/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
               <div className="w-full">
                 <h3 className="font-bold text-[#ba1a1a] flex items-center gap-2 text-lg">
                   🚨 MSME Distressed Flow Warning
                 </h3>
                 <p className="text-sm text-[#93000a] mt-1 font-medium">
                   Our AI has detected a significant supply chain disruption affecting your liquidity. Restructuring is recommended to protect your credit standing.
                 </p>
               </div>
               <button onClick={onHelpSelect} className="shrink-0 bg-[#ba1a1a] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#93000a] transition-colors whitespace-nowrap">
                 Apply for Restructuring
               </button>
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-8 rounded-lg bg-surface-container-low flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div>
                <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">{data.businessName || 'Business Name'}</h2>
                <div className="flex gap-4 mt-2">
                   <span className="text-xs text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full border border-outline-variant/10 font-bold">GSTIN: {data.gstNumber || '27AABCG1234L1Z5'}</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-lg bg-primary text-on-primary flex flex-col justify-between">
              <div>
                <p className="text-sm opacity-80 font-bold">Health Score</p>
                <h3 className="text-5xl font-extrabold mt-2">{Math.round(data.score)}</h3>
              </div>
              <div className="mt-6">
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${data.score}%` }}></div>
                </div>
                <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">{data.band || 'WATCH'}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Financial Health Breakdown */}
            <div className="lg:col-span-8 p-8 rounded-lg bg-surface-container-low">
              <h3 className="text-xl font-bold mb-8">Financial Health Matrix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-widest">Growth Index</p>
                  <p className="text-2xl font-bold">{data.breakdown?.growth_potential ? Math.round((data.breakdown.growth_potential / 30) * 100) : 92}%</p>
                </div>
                <div className="p-6 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-widest">Credit Health</p>
                  <p className="text-2xl font-bold">{data.breakdown?.credit_health ? Math.round((data.breakdown.credit_health / 40) * 100) : 88}%</p>
                </div>
                <div className="p-6 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-widest">Safety Shield</p>
                  <p className="text-2xl font-bold">{data.breakdown?.safety_shield ? Math.round((data.breakdown.safety_shield / 30) * 100) : 95}%</p>
                </div>
              </div>
              <div className="mt-8 p-6 rounded-lg bg-emerald-100/30 border border-emerald-200/50 flex items-start gap-4">
                 <span className="material-symbols-outlined text-primary">auto_awesome</span>
                 <p className="text-xs text-on-surface-variant">
                    {data.score > 70 
                      ? "Eligible for expansion financing at preferred rates." 
                      : data.score > 40 
                      ? "Mild stress detected. Improve turnover to recover score." 
                      : "CRITICAL: Urgent liquidity injection or restructuring needed."}
                 </p>
              </div>
            </div>

            <div className="lg:col-span-4 p-8 rounded-lg bg-surface-container-highest flex flex-col justify-between">
              <h3 className="text-xl font-bold mb-6">Simulation Sandbox</h3>
              <div className="space-y-4">
                 <button onClick={() => onSimulate('REVENUE_DROP')} className="w-full p-4 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-between hover:bg-rose-100 transition-all">
                    <span>Simulate Revenue Drop</span>
                    <span className="material-symbols-outlined">trending_down</span>
                 </button>
                 <button onClick={() => onSimulate('FRAUD_ALERT')} className="w-full p-4 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs flex items-center justify-between hover:bg-amber-100 transition-all">
                    <span>Simulate Fraud Alert</span>
                    <span className="material-symbols-outlined">security</span>
                 </button>
              </div>
              <button onClick={onHelpSelect} className="mt-6 w-full py-4 bg-emerald-900 text-white rounded-lg font-bold text-sm">Contact Account Manager</button>
            </div>

            <div className="lg:col-span-12 p-8 rounded-lg bg-surface-container-low">
              <h3 className="text-xl font-bold mb-8">EMI Transaction Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20">
                      <th className="pb-4">Date</th><th className="pb-4">ID</th><th className="pb-4">Amount</th><th className="pb-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {(data.emiSchedule || []).map((txn, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-high transition-colors">
                        <td className="py-5 text-sm">{new Date(txn.dueDate).toLocaleDateString()}</td>
                        <td className="py-5 text-sm font-bold">{txn.emiId}</td>
                        <td className="py-5 text-sm font-bold text-primary">₹{txn.amount.toLocaleString('en-IN')}</td>
                        <td className="py-5 text-xs font-bold uppercase">{txn.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
