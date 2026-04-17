import React, { useState } from 'react';
import { Activity, Bell, Settings, Search, Download, LogOut, ShieldAlert, BarChart3, TrendingDown, Zap, MessageSquare, X, Send, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import api from '../api/axios';

export default function MSMEDashboard({ data, loading, onHelpSelect, onSimulate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, health

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openChatModal = async () => {
    setChatOpen(true);
    try {
      const res = await api.get(`/chat/${data.customerId}`);
      setChatHistory(res.data.messages || []);
    } catch {
      setChatHistory([]);
    }
  };

  const submitChat = async () => {
    if (!chatMessage.trim()) return;
    setChatSending(true);
    try {
       const res = await api.post(`/chat/${data.customerId}`, { sender: 'CUSTOMER', text: chatMessage });
       setChatHistory(res.data.messages || []);
       // If this is the start of a conversation, notification is created on backend
       setChatMessage('');
    } catch {
       addToast('Failed to send message', 'error');
    } finally {
       setChatSending(false);
    }
  };

  const handleAcceptRestructure = async (interventionId) => {
    try {
      await api.post(`/portal/${data.customerId}/accept-restructure`, { interventionId });
      addToast('Restructuring plan accepted! Your dashboard will refresh now.', 'success');
      window.location.reload();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept plan', 'error');
    }
  };

  if (loading || !data) return <div className="p-8 text-on-surface">Loading...</div>;

  return (
    <div className="bg-background text-on-background antialiased flex overflow-hidden min-h-screen font-['Plus_Jakarta_Sans']">
      {/* SideNavBar - Original State */}
      <aside className="hidden md:flex flex-col h-full py-6 bg-emerald-50 dark:bg-emerald-950 w-64 border-r-0 font-medium antialiased shrink-0">
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-50 tracking-tight">VittChetak</h1>
          <p className="text-xs text-green-600 font-semibold uppercase tracking-widest mt-1">{t('nav.premiumTier')}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'overview' ? 'text-green-700 dark:text-green-300 font-bold border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'}`}
          >
            <span className="material-symbols-outlined font-bold">dashboard</span>
            <span>{t('nav.dashboard')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'transactions' ? 'text-green-700 dark:text-green-300 font-bold border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'}`}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span>{t('nav.emiTransactions')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'health' ? 'text-green-700 dark:text-green-300 font-bold border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 dark:text-emerald-200/50 hover:text-green-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'}`}
          >
            <span className="material-symbols-outlined">health_and_safety</span>
            <span>{t('nav.financialHealth')}</span>
          </button>
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
            <span className="text-sm">{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-8 py-3 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input className="w-full bg-surface-container-high border-none rounded-full py-2 pl-10 pr-4 text-sm" placeholder={t('msme.searchPlaceholder')} type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <img alt="Business avatar" className="w-8 h-8 rounded-lg object-cover border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_N5mvZRMRdMOkGKOuyNZrO-IekUnOTlpbRDbG5PQ5NUFGiASH5WyEdSg1M1Kr5aw_X2QAxENV-26Fg65z_BFlwrmBqexNpRsMBA3hSHePMEd9Cy6FcbCaEOYhYvzltqeyfKlyBR9get7Wdeggi_SLcQdVp2x9I42NyUk4bYmrDJXj3dzNcCitGjexzMu4xSHwVCjmPUQX2aafeJdQfqgJ1tiLa8E_63WfRyKC0lGyPQf7_xUa17BZIgj0XQ2I9o6VBrN2rX5C5g"/>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8">
          {/* MASSIVE PREMIUM RESTRUCTURING CALL-TO-ACTION */}
          {data.restructuringProposal && (
            <div className="bg-[#062411] rounded-3xl p-10 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-[0_20px_60px_rgba(0,110,45,0.2)] border border-emerald-500/30 overflow-hidden relative group animate-in zoom-in-95 duration-700">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -mr-64 -mt-64 transition-all group-hover:bg-emerald-500/20"></div>
               
               <div className="relative z-10 lg:max-w-xl">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="bg-emerald-500/20 p-2 rounded-lg">
                     <Zap className="w-6 h-6 text-[#1db954] animate-pulse" />
                   </div>
                   <span className="text-xs font-black text-[#1db954] uppercase tracking-[0.3em]">{t('msme.vittChetakVerified')}</span>
                 </div>
                 <h2 className="text-4xl font-black text-white leading-tight">
                   {t('msme.restructuringReady')}
                 </h2>
                 
                 {data.restructuringProposal.messagePreview && (
                   <div className="mt-6 bg-[#004118] border-l-4 border-[#1db954] p-4 rounded-r-xl w-full max-w-lg">
                     <p className="text-[10px] font-bold text-[#1db954] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <MessageSquare className="w-4 h-4"/> {t('msme.adminMessage')}
                     </p>
                     <p className="text-sm text-emerald-50 italic leading-relaxed font-medium">
                       "{data.restructuringProposal.messagePreview}"
                     </p>
                   </div>
                 )}

                 <p className="text-emerald-100/60 mt-6 text-lg font-medium leading-relaxed">
                   {t('msme.restructuringDescription')}
                 </p>
                 <div className="flex flex-wrap gap-4 mt-8">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Revised EMI</p>
                      <p className="text-xl font-black text-white">₹{data.restructuringProposal.restructuringPlan?.revisedEmi?.toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Relief Logic</p>
                      <p className="text-sm font-bold text-white">25% Cash Flow Boost</p>
                    </div>
                 </div>
               </div>

               <button 
                 onClick={() => handleAcceptRestructure(data.restructuringProposal._id)}
                 className="relative z-10 shrink-0 bg-[#1db954] text-white px-10 py-6 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(29,185,84,0.4)] hover:bg-[#159a43] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group/btn"
               >
                 REVIEW & SIGN PLAN
                 <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
               </button>
            </div>
          )}

          {data.hasPendingRequest && !data.restructuringProposal && (
            <div className="bg-emerald-50 border-[1.5px] border-emerald-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse">
               <div className="w-full">
                 <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-lg">
                   ⏳ Restructuring Analysis in Progress
                 </h3>
                 <p className="text-sm text-emerald-700 mt-1 font-medium">
                   Our credit team is currently reviewing your application. You will see a proposed plan here once the analysis is complete.
                 </p>
               </div>
               <div className="shrink-0 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                 <Activity className="w-4 h-4" /> Under Review
               </div>
            </div>
          )}

          {/* Proactive Risk Alert */}
          {(data.score < 70 || (data.emiSchedule && data.emiSchedule.some(e => e.status === 'OVERDUE'))) && 
           !data.restructuringProposal && 
           !data.hasPendingRequest && (
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

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 p-8 rounded-lg bg-surface-container-low flex items-center justify-between relative overflow-hidden shadow-sm border border-outline-variant/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div>
                <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">{data.businessName || 'Business Name'}</h2>
                <div className="flex gap-4 mt-2">
                   <span className="text-xs text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full border border-outline-variant/10 font-bold uppercase tracking-wider">GSTIN: {data.gstNumber || '27AAAAA0000A1Z5'}</span>
                   <span className="text-xs text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full border border-outline-variant/10 font-bold uppercase tracking-wider">{data.industrySector || 'MSME'}</span>
                </div>
              </div>
            </div>

            {/* Business Pulse Metrics */}
            <div className="p-8 rounded-lg bg-white border border-outline-variant/10 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-emerald-800">Monthly Revenue</p>
                <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">+5.2%</div>
              </div>
              <h3 className="text-2xl font-black mt-2 text-on-surface">₹{(data.businessMetrics?.revenue || 850000).toLocaleString()}</h3>
            </div>

            <div className="p-8 rounded-lg bg-emerald-700 text-white flex flex-col justify-between shadow-lg">
              <div>
                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Financial Health Score</p>
                <h3 className="text-6xl font-black mt-2">{Math.round(data.score)}</h3>
              </div>
              <div className="mt-4">
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full transition-all duration-1000" style={{ width: `${data.score}%` }}></div>
                </div>
                <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">{data.band || (data.score > 70 ? 'STABLE' : 'CRITICAL')}</p>
              </div>
            </div>
          </section>

          {activeTab === 'overview' && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
               {/* GST Status Card */}
               <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 shadow-sm flex items-center gap-6">
                 <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined">description</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Compliance Pulse</p>
                   <p className="text-sm font-bold text-on-surface">GST Filed: {data.businessMetrics?.gstStatus?.lastFiled || 'March 2026'}</p>
                   <p className="text-[10px] text-emerald-600 font-bold">Tax Score: {data.businessMetrics?.gstStatus?.taxScore || 88}/100</p>
                 </div>
               </div>

               {/* Profit Card */}
               <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 shadow-sm flex items-center gap-6">
                 <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined">payments</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Operating Profit</p>
                   <p className="text-sm font-bold text-on-surface">₹{(data.businessMetrics?.profit || 142000).toLocaleString()}</p>
                   <p className="text-[10px] text-rose-600 font-bold">-2.1% against prev month</p>
                 </div>
               </div>

               {/* Pending Loans Card */}
               <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 shadow-sm flex items-center gap-6">
                 <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-700">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Loan Exposure</p>
                   <p className="text-sm font-bold text-on-surface">{data.businessMetrics?.loanSummary?.totalPending || 1} Pending Repayments</p>
                   <p className="text-[10px] text-on-surface-variant font-bold">Outstanding: ₹{(data.businessMetrics?.loanSummary?.totalAmount || 8000).toLocaleString()}</p>
                 </div>
               </div>
            </section>
          )}
          
          {/* Restructuring Center (Proposal Stage) */}
          {data.restructuringProposal && (
            <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-emerald-950 p-6 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500 animate-pulse" /> AI Restructuring Center
                  </h3>
                  <p className="text-sm opacity-70">A specialized recovery plan has been proposed for your business.</p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  Awaiting Acceptance
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Logic & Reasoning</h4>
                  <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-200/50">
                    <p className="text-sm leading-relaxed text-emerald-950 font-medium italic">
                      "{data.restructuringProposal.restructuringPlan?.logic || "Analysis of your cash flow pattern suggests temporary liquidity stress. This plan aims to lower your debt burden while business activity recovers."}"
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200/50">
                    <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed font-bold">
                      Proactive Intervention: Accepting this plan will prevent a technical default and preserve your long-term Credit Index.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Plan Comparison (Before vs After)</h4>
                  <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-emerald-50">
                        <tr>
                          <th className="p-3 font-bold opacity-60">Metric</th>
                          <th className="p-3 font-bold opacity-60">Current</th>
                          <th className="p-3 font-bold text-emerald-800 underline decoration-2">New Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 font-medium">
                        <tr>
                          <td className="p-3 opacity-70">Monthly EMI</td>
                          <td className="p-3">₹{data.restructuringProposal.restructuringPlan?.originalEmi?.toLocaleString()}</td>
                          <td className="p-3 font-black text-emerald-700">₹{data.restructuringProposal.restructuringPlan?.revisedEmi?.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-3 opacity-70">Term Extension</td>
                          <td className="p-3">0 Months</td>
                          <td className="p-3 font-black text-emerald-700">+{data.restructuringProposal.restructuringPlan?.tenureExtensionMonths} Months</td>
                        </tr>
                        <tr>
                          <td className="p-3 opacity-70">Cash Flow Relief</td>
                          <td className="p-3">—</td>
                          <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">~25% DROP</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button 
                    onClick={() => handleAcceptRestructure(data.restructuringProposal._id)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
                  >
                    Accept & Apply New Schedule <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'health') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 animate-in fade-in duration-700">
              {/* Financial Health Breakdown */}
              <div className="lg:col-span-8 p-8 rounded-lg bg-surface-container-low shadow-sm border border-outline-variant/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" /> Financial Health Matrix</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-lg bg-white border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-on-surface-variant mb-4 uppercase tracking-[0.2em]">Growth Potential</p>
                    <p className="text-3xl font-black text-emerald-800">{Math.round(data.breakdown?.liquidityIndex || 92)}%</p>
                  </div>
                  <div className="p-6 rounded-lg bg-white border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-on-surface-variant mb-4 uppercase tracking-[0.2em]">Credit Resilience</p>
                    <p className="text-3xl font-black text-emerald-800">{Math.round(data.breakdown?.incomeStability || 88)}%</p>
                  </div>
                  <div className="p-6 rounded-lg bg-white border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-on-surface-variant mb-4 uppercase tracking-[0.2em]">Ecosystem Safety</p>
                    <p className="text-3xl font-black text-emerald-800">{Math.round(data.breakdown?.portfolioHealth || 95)}%</p>
                  </div>
                </div>
                <div className="mt-8 p-6 rounded-lg bg-emerald-100/30 border border-emerald-200/50 flex items-start gap-4">
                   <span className="material-symbols-outlined text-emerald-700">auto_awesome</span>
                   <p className="text-xs text-on-surface-variant leading-relaxed">
                      {data.score > 70 
                        ? "Eligible for expansion financing at preferred interest rates. Your turnover velocity is exceptional." 
                        : data.score > 40 
                        ? "Mild stress detected. Strengthening your supplier repayment cycle will improve the resilience index." 
                        : "CRITICAL: Urgent liquidity injection or invoice discounting is highly recommended."}
                   </p>
                </div>
              </div>

              {/* Simulation Sandbox Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-8 rounded-lg bg-surface-container-low shadow-sm border border-outline-variant/10">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2 font-['Plus_Jakarta_Sans'] leading-tight"><Zap className="w-5 h-5 text-amber-500" /> Simulation Sandbox</h3>
                  <div className="space-y-4">
                     <button onClick={() => onSimulate('REVENUE_DROP')} className="w-full p-4 bg-white border border-outline-variant/10 rounded-xl hover:bg-rose-50 transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <TrendingDown className="w-5 h-5 text-rose-600" />
                          <span className="text-sm font-bold text-on-surface text-left">Simulate Revenue Drop</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
                     </button>
                     <button onClick={() => onSimulate('LATE_PAYMENT')} className="w-full p-4 bg-white border border-outline-variant/10 rounded-xl hover:bg-amber-50 transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-3 text-left">
                          <Activity className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-bold text-on-surface text-left">Simulate Late Payment</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
                </div>
                <button onClick={openChatModal} className="w-full py-4 bg-emerald-800 text-white rounded-lg font-bold text-sm shadow-md hover:bg-emerald-900 transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat with Account Manager
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'transactions') && (
            <div className="animate-in slide-in-from-bottom-6 duration-700">
              {/* Transaction Logs */}
              <div className="p-8 rounded-lg bg-white shadow-sm border border-outline-variant/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" /> EMI Transaction Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] border-b border-outline-variant/20">
                      <th className="pb-4">Due Date</th><th className="pb-4">TX Reference</th><th className="pb-4">Quantum</th><th className="pb-4 font-bold">Log Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {(data.emiSchedule || []).map((txn, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-5 text-sm font-medium">{new Date(txn.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="py-5 text-sm font-bold text-emerald-950">{txn.emiId}</td>
                        <td className="py-5 text-sm font-extrabold text-emerald-700">₹{txn.amount.toLocaleString('en-IN')}</td>
                        <td className="py-5">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${txn.status === 'PAID' ? 'bg-emerald-100/60 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-[#131e17] p-4 flex justify-between items-center px-6">
                <div>
                  <h3 className="text-white font-bold leading-tight">Bank Admin Communication</h3>
                  <p className="text-gray-400 text-xs text-[10px] uppercase font-bold tracking-widest">Audit Secure Channel</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 bg-white flex-1 overflow-y-auto max-h-[400px] flex flex-col gap-4">
                {chatHistory.length === 0 ? <p className="text-sm text-gray-500 text-center py-4 italic">No prior communication.</p> : 
                  chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 px-4 rounded-xl max-w-[85%] text-sm ${m.sender === 'CUSTOMER' ? 'bg-emerald-900 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>{m.text}</div>
                    </div>
                ))}
             </div>
             <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl">
                  <input type="text" placeholder="Type your message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitChat()} className="flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0 px-2"/>
                  <button disabled={chatSending || !chatMessage.trim()} onClick={submitChat} className="p-2 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors disabled:opacity-50">
                    {chatSending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4"/>}
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
