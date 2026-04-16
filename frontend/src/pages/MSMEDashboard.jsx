import React from 'react';
import { Activity, Bell, Settings, Search, Download, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MSMEDashboard({ data, loading, onHelpSelect }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
          {/* Active Tab: Dashboard */}
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-700 dark:text-green-300 font-bold border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20 transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>EMI Transactions</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span>Financial Health</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">help_center</span>
            <span>Support</span>
          </a>
        </nav>
        <div className="px-4 mt-auto">
          <div className="p-4 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center gap-2 font-bold cursor-pointer transition-transform active:scale-95 shadow-xl shadow-primary/10 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span>AI Insights</span>
          </div>
          <div className="mt-6 flex items-center gap-3 px-2">
            <img alt="User profile photo" className="w-10 h-10 rounded-full bg-surface-container-highest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOSTiyTF4M4_Bbq-tcleqIT8rXdBS4omIoY4jQ2Y-eFnGoINX6VeOrIxRD-xeN_rmAx9w_MY2nqQx7veqJalzVj3wFVnj6cokfkYAlUsuRRM9Zr8-Wx2TwjM-7ooWEDMsXumfkYoZGVxMfkf82mjrhU4PQfipdpHSHqAwX8R453PWubj6IaBoO90acdEBnSdrULzvOTKIag0Aokw7NtwwhHmpHesq5k6QsBJbaJTxiPUalcBmkOMGXE-3yF_RF5qGAzslf0lpF0Q"/>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{data.name}</p>
              <p className="text-xs opacity-70 truncate">{data.businessName || 'MSME User'}</p>
            </div>
          </div>
          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 text-emerald-800/70 dark:text-emerald-200/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-green-600 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-bold"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* TopNavBar */}
        <header className="bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-8 py-3 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input className="w-full bg-surface-container-high border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/60" placeholder="Search transactions, reports..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:bg-white/50 dark:hover:bg-black/20 rounded-full p-2 relative text-on-surface">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="hover:bg-white/50 dark:hover:bg-black/20 rounded-full p-2 text-on-surface">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-none">{data.businessName || 'Business Name'}</p>
                <p className="text-[10px] text-primary font-medium">MSME GOLD</p>
              </div>
              <img alt="Business avatar" className="w-8 h-8 rounded-lg bg-primary-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_N5mvZRMRdMOkGKOuyNZrO-IekUnOTlpbRDbG5PQ5NUFGiASH5WyEdSg1M1Kr5aw_X2QAxENV-26Fg65z_BFlwrmBqexNpRsMBA3hSHePMEd9Cy6FcbCaEOYhYvzltqeyfKlyBR9get7Wdeggi_SLcQdVp2x9I42NyUk4bYmrDJXj3dzNcCitGjexzMu4xSHwVCjmPUQX2aafeJdQfqgJ1tiLa8E_63WfRyKC0lGyPQf7_xUa17BZIgj0XQ2I9o6VBrN2rX5C5g"/>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="flex-1 p-8 space-y-8">
          {/* Business Profile Header */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-8 rounded-lg bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div>
                <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">{data.businessName || 'Business Name'}</h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    GSTIN: {data.gstNumber || '27AABCG1234L1Z5'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    Pune, MH
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/10 flex items-center gap-4 z-10">
                <img alt="Manager" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk04SJb9pvBukA0obc95JelgyR5kPaGdXigusxUdOoMZapzivcXd0O9b7O_ksVACLpBhplSNk0RPBjEpYJ8hiiUnD6jmpiIlF66-POGP3rOWb4_k3jaxUeMk_brjy-LDpKhGOFWZo6jHDi3wWRdwq-Yfeg788rXPZqoL1w_wyiFhwSWmSu9K4GZYsGWNUvBwoPkaO0CMoPpzC0WBE12AXu-5iyidMMkWkhYyVnUI4M6yBciCoWUvztcBId31dtvq9Wu6nBvhDNJQ"/>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">Account Manager</p>
                  <p className="text-sm font-bold">Vikram Singh</p>
                  <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    Contact Specialist
                  </button>
                </div>
              </div>
            </div>

            {/* AI Quick Health Gauge */}
            <div className="p-8 rounded-lg bg-primary text-on-primary flex flex-col justify-between relative overflow-hidden">
              <div className="z-10">
                <p className="text-sm font-headline opacity-80">Overall Health Score</p>
                <h3 className="text-5xl font-headline font-extrabold mt-2">{data.score ? Math.round(data.score * 8.5) : 842}</h3>
                <p className="text-sm mt-1 bg-primary-container/30 inline-block px-2 py-0.5 rounded text-white">+12 pts from last month</p>
              </div>
              <div className="z-10 mt-6">
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-fixed-dim h-full" style={{ width: `${data.score || 84}%` }}></div>
                </div>
                <p className="text-[10px] mt-2 font-medium tracking-wider uppercase opacity-80">{data.band ? data.band.replace('_', ' ') : 'Excellent Creditworthiness'}</p>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-10">eco</span>
            </div>
          </section>

          {/* Main Dashboard Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Financial Health Breakdown */}
            <div className="lg:col-span-8 p-8 rounded-lg bg-surface-container-low">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-headline font-bold text-on-surface">Financial Health Matrix</h3>
                <button className="text-sm text-primary font-bold flex items-center gap-1">
                  Detailed Audit <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-xs font-medium text-on-surface-variant mb-4 uppercase tracking-widest">Supply Chain</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-headline font-bold">92%</span>
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <p className="text-[10px] text-green-600 mt-2">Optimized Flow</p>
                </div>
                <div className="p-6 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-xs font-medium text-on-surface-variant mb-4 uppercase tracking-widest">Working Capital</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-headline font-bold">₹1.2Cr</span>
                    <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  </div>
                  <p className="text-[10px] text-primary mt-2">Current Index: 1.4</p>
                </div>
                <div className="p-6 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-xs font-medium text-on-surface-variant mb-4 uppercase tracking-widest">Risk Exposure</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-headline font-bold">Low</span>
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-2">3 At-risk debtors</p>
                </div>
              </div>
              <div className="mt-8 p-6 rounded-lg bg-emerald-100/30 border border-emerald-200/50 flex items-start gap-4">
                <div className="p-2 bg-primary text-on-primary rounded-lg">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">AI Recommendation</p>
                  <p className="text-xs text-on-surface-variant mt-1">Based on your healthy supply chain flow, you are eligible for an equipment financing expansion of up to ₹45 Lakhs at a reduced 8.4% APR.</p>
                </div>
              </div>
            </div>

            {/* Priority Support */}
            <div className="lg:col-span-4 p-8 rounded-lg bg-surface-container-highest flex flex-col">
              <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Business Helpdesk</h3>
              <div className="space-y-4 flex-1">
                <button onClick={onHelpSelect} className="w-full p-4 rounded-lg bg-surface-container-lowest flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">chat_bubble</span>
                    <span className="text-sm font-bold">Live Business Chat</span>
                  </div>
                  <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </button>
                <button onClick={onHelpSelect} className="w-full p-4 rounded-lg bg-surface-container-lowest flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">video_call</span>
                    <span className="text-sm font-bold">Schedule Video Call</span>
                  </div>
                  <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </button>
                <button className="w-full p-4 rounded-lg bg-surface-container-lowest flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <span className="text-sm font-bold">Document Center</span>
                  </div>
                  <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
                <p className="text-xs text-on-surface-variant font-medium">Dedicated Priority Line</p>
                <p className="text-lg font-headline font-extrabold text-primary">1800-VITT-CHETAK</p>
              </div>
            </div>

            {/* EMI Transaction Logs */}
            <div className="lg:col-span-12 p-8 rounded-lg bg-surface-container-low overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-headline font-bold text-on-surface">EMI Transaction Logs</h3>
                  <p className="text-xs text-on-surface-variant">Review and manage your business loan schedules</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-full border border-outline-variant text-xs font-bold hover:bg-surface-container-highest transition-colors">Export CSV</button>
                  <button className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-lg shadow-primary/20">Upcoming EMIs</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20">
                      <th className="pb-4 font-semibold">Transaction Date</th>
                      <th className="pb-4 font-semibold">Reference ID</th>
                      <th className="pb-4 font-semibold">Description</th>
                      <th className="pb-4 font-semibold">Amount</th>
                      <th className="pb-4 font-semibold">Status</th>
                      <th className="pb-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {[
                      { date: 'Oct 15, 2023', id: 'VC-TXN-90214', desc: 'Warehouse Expansion Loan #2', amount: '₹1,42,500.00', status: 'Paid' },
                      { date: 'Sep 15, 2023', id: 'VC-TXN-88412', desc: 'Warehouse Expansion Loan #2', amount: '₹1,42,500.00', status: 'Paid' },
                      { date: 'Aug 28, 2023', id: 'VC-TXN-82155', desc: 'Cold Storage Financing EMI #8', amount: '₹85,200.00', status: 'Paid' },
                      { date: 'Aug 15, 2023', id: 'VC-TXN-81204', desc: 'Warehouse Expansion Loan #2', amount: '₹1,42,500.00', status: 'Paid' }
                    ].map((txn, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-high transition-colors group">
                        <td className="py-5 text-sm font-medium">{txn.date}</td>
                        <td className="py-5 text-sm font-headline font-bold">{txn.id}</td>
                        <td className="py-5 text-sm text-on-surface-variant">{txn.desc}</td>
                        <td className="py-5 text-sm font-bold text-primary">{txn.amount}</td>
                        <td className="py-5 text-xs">
                          <span className={`px-2 py-1 rounded-full font-bold ${txn.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-5 text-right">
                          <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors" title="Download Invoice">
                            <Download className="w-5 h-5" />
                          </button>
                        </td>
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
