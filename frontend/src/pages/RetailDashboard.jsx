import React, { useState } from 'react';
import { Search, Bell, Settings, ArrowRight, HelpCircle, Wallet, MessageSquare, LogOut, ShieldAlert, HeartPulse, X, Send, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import api from '../api/axios';

export default function RetailDashboard({ data, loading, onHelpSelect, onPayEmi, onSimulate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t, dateLocale } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [shockLoading, setShockLoading] = useState(false);

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
       if (!chatHistory.length) {
         await api.post(`/portal/${data.customerId}/request-counsellor`, { message: chatMessage });
       }
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
      addToast('Plan accepted! Your debt schedule has been updated.', 'success');
      window.location.reload();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept plan', 'error');
    }
  };

  const simulateMarketShock = async () => {
    setShockLoading(true);
    try {
      await onSimulate('MISS_EMI');
      addToast('Shock simulation triggered. Monitoring risk fluctuations.', 'warning');
    } catch {
      addToast('Failed to trigger simulation', 'error');
    } finally {
      setShockLoading(false);
    }
  };

  const handleInactiveFeature = (name) => {
    addToast(`${name} is currently in Beta. Please check back later!`, 'info');
  };

  // Translate status labels
  const getStatusLabel = (status) => {
    if (status === 'PAID') return t('status.paid');
    if (status === 'OVERDUE') return t('status.overdue');
    return t('status.pending');
  };

  // Translate band labels
  const getBandLabel = (band) => {
    if (!band) return t('band.excellent');
    const key = band.toLowerCase().replace(' ', '_');
    return t(`band.${key}`) || band.replace('_', ' ');
  };

  if (loading || !data) return <div className="p-8 text-on-surface">Loading...</div>;

  return (
    <div className="flex min-h-screen overflow-hidden bg-surface text-on-background">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-full py-6 bg-emerald-50 dark:bg-emerald-950 w-64 border-r-0 font-['Plus_Jakarta_Sans'] font-medium antialiased shrink-0 min-h-screen">
        <div className="px-8 mb-10">
          <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-50 tracking-tight">VittChetak</h1>
          <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold mt-1">{t('nav.premiumTier')}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'dashboard' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>{t('nav.dashboard')}</span>
          </button>
          <button onClick={() => setActiveTab('emi')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'emi' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span>{t('nav.emiTransactions')}</span>
          </button>
          <button onClick={() => setActiveTab('health')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'health' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">health_and_safety</span>
            <span>{t('nav.financialHealth')}</span>
          </button>
          <button onClick={() => setActiveTab('support')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'support' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">help_center</span>
            <span>{t('nav.supportHub')}</span>
          </button>
        </nav>
        <div className="mt-auto px-4 pb-4">
          <button onClick={() => handleInactiveFeature('Pro AI Insights')} className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-800 text-white rounded-lg font-bold text-sm shadow-xl shadow-emerald-900/10 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            {t('nav.aiInsights')}
          </button>
          <div className="mt-6 px-4 flex items-center gap-3">
            <img alt="User profile photo" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt530Pm_OOXTQ2YTDeTI1SvWDHvy_c30n2kP0Yd7Yv_PCdTbFPKc4DUkc6-pgWSbrkouskKfTAJ5D1wfyoLUf99pJjMsZlMv8G3BtWeoxZTUW4rSnWOA9L_FQjzgEF_2MS2wRYJBdXA5Y1t0AWoLcBbe3m2TNSQpXrXBpoQ_TRmA2lo58qB4lN76tRu1beHuURqvRmeb5Q06_jFG_I4hqAMnqPysu6rk2gvmfGrhZk3TC5kEwpcALQRRvQvTVPVWij_tE8-Km7wQ"/>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{data.name}</p>
              <p className="text-[10px] text-on-surface-variant">{t('nav.growthMember')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-4 text-emerald-800/70 dark:text-emerald-200/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-green-600 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-bold">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface relative">
        <header className="flex justify-between items-center w-full px-8 py-3 bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xl top-0 sticky z-50 transition-all font-['Plus_Jakarta_Sans'] text-sm">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
              <input className="w-full bg-surface-container-highest dark:bg-emerald-900/30 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/30 text-sm placeholder:text-on-surface-variant/60" placeholder={t('search.placeholder')} type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img alt="User avatar" className="w-8 h-8 rounded-full border border-emerald-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtTJ23MDex2bCgpwE7AeG44iS3OkUEa-77kOeGBG_XvyoiJomQ59O-3kBu4c_hYo0Aq8ODiC8-1f9fvBsJFZLmbwyMvmKRyvqIPXzH2EiDsnazIA0xuF0M5YcPs8oxwI-_hAWx2Ppe4JfYhhE246FvPN230s6uzfDjAgTii23ZcSBgzirjPofcHUKXonWORPe_0U2A5mFNn7kXLmrf-9c_usryhzZ6z_y8K6Ty9lMwgWEEmIhuiPVmVtPS4z1MxvtbZHirJcG6Sg"/>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* AI Proactive Banner */}
          {(data.score < 70 || (data.emiSchedule && data.emiSchedule.some(e => e.status === 'OVERDUE'))) && !data.restructuringProposal && !data.hasPendingRequest && (
            <div className="bg-[#ffdad6] border-[1.5px] border-[#ba1a1a]/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#ba1a1a]/5 rounded-full blur-2xl font-bold animate-pulse" />
               <div className="relative z-10 w-full">
                 <h3 className="font-bold text-[#ba1a1a] flex items-center gap-2 text-lg">
                   🚨 {t('warning.title')}
                 </h3>
                 <p className="text-sm text-[#93000a] mt-1 pr-4 font-medium">
                   {t('warning.description')}
                 </p>
               </div>
               <button onClick={onHelpSelect} className="shrink-0 bg-[#ba1a1a] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-[#93000a] transition-colors whitespace-nowrap relative z-10">
                 {t('warning.contactAdmin')}
               </button>
            </div>
          )}

          {/* Restructuring Center (Retail Proposal) */}
          {data.restructuringProposal && (
            <div className="bg-white dark:bg-emerald-950 rounded-2xl border-2 border-emerald-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="bg-emerald-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-xl"><Zap className="w-8 h-8 text-amber-400" /></div>
                  <div>
                    <h3 className="text-xl font-bold">Personalized Relief Plan</h3>
                    <p className="text-sm opacity-60">AI-optimized restructuring to protect your credit health.</p>
                  </div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12">
                   <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest mb-4">Why we suggested this?</h4>
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex flex-col gap-4">
                      {data.restructuringProposal.messagePreview && (
                        <div className="w-full bg-emerald-900 shadow-sm border-l-4 border-emerald-500 p-4 rounded-r-xl">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5"/> Official Message from Admin
                          </p>
                          <p className="text-sm italic text-emerald-50 leading-relaxed font-medium">"{data.restructuringProposal.messagePreview}"</p>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <MessageSquare className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">AI Logic Formulation</p>
                          <p className="text-sm italic text-emerald-950 dark:text-emerald-50 font-medium">"{data.restructuringProposal.restructuringPlan?.logic}"</p>
                        </div>
                      </div>
                   </div>
                </div>
                
                <div className="lg:col-span-7">
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest mb-4">Revised Repayment Structure</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-gray-50 dark:bg-emerald-900/10 rounded-2xl border border-gray-100 dark:border-emerald-800">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Old EMI</p>
                      <p className="text-xl font-black line-through opacity-40">₹{data.restructuringProposal.restructuringPlan?.originalEmi?.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-200 dark:border-emerald-700">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">New Monthly EMI</p>
                      <p className="text-2xl font-black text-emerald-800 dark:text-emerald-100">₹{data.restructuringProposal.restructuringPlan?.revisedEmi?.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-emerald-900/10 rounded-2xl border border-gray-100 dark:border-emerald-800">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Tenure</p>
                      <p className="text-xl font-black opacity-60">Standard</p>
                    </div>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-200 dark:border-emerald-700">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">New Tenure</p>
                      <p className="text-2xl font-black text-emerald-800 dark:text-emerald-100">+{data.restructuringProposal.restructuringPlan?.tenureExtensionMonths} Months Extension</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between">
                   <div className="p-6 bg-emerald-950 text-white rounded-2xl shadow-inner">
                      <h5 className="font-bold mb-2">ML Confidence Index</h5>
                      <p className="text-xs opacity-70 mb-4">Our model predicts a 92% recovery probability if this plan is followed.</p>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[92%]"></div>
                      </div>
                   </div>
                   <button 
                    onClick={() => handleAcceptRestructure(data.restructuringProposal._id)}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-3 mt-4"
                   >
                     Confirm & Accept New Plan <CheckCircle className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8 pb-12">
            {/* Hero Section (Bento Grid Style) */}
            {(activeTab === 'dashboard' || activeTab === 'health') && (
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Welcome Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#004f20] to-[#006e2d] rounded-lg p-8 text-on-primary flex flex-col justify-between min-h-[240px] relative overflow-hidden shadow-xl shadow-[#004f20]/20">
                <div className="relative z-10">
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">{t('welcome.title', { name: data.name?.split(' ')[0] })}</h2>
                  <p className="text-emerald-100 max-w-md text-sm">{t('welcome.subtitle')}</p>
                </div>
                <div className="relative z-10 flex gap-8 mt-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#72fe8f] font-bold">{t('welcome.totalDebt')}</p>
                    <p className="text-3xl font-black mt-1 tracking-tight text-white">₹{data.mlFeatures?.retail?.creditAmount?.toLocaleString() || '4,20,000'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#72fe8f] font-bold">{t('welcome.riskExposure')}</p>
                    <p className="text-3xl font-black mt-1 tracking-tight text-white">{data.score < 50 ? t('welcome.high') : t('welcome.low')}</p>
                  </div>
                </div>
                {/* Aesthetic Glass Circle Decoration */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#72fe8f]/10 rounded-full blur-3xl"></div>
              </div>

              {/* Financial Health Card */}
              <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm border border-outline-variant/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-1"><HeartPulse className="w-3 h-3 text-primary" /> {t('health.healthScore')}</p>
                <div className="relative flex items-center justify-center mb-4">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-surface-container stroke-[8]" cx="50" cy="50" r="40"></circle>
                    <circle className={`fill-none stroke-[8] ${data.score < 50 ? 'stroke-[#ba1a1a]' : 'stroke-primary'}`} strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`calc(251.2 - (251.2 * ${data.score}) / 100)`} cx="50" cy="50" r="40"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface">
                    <span className={`text-3xl font-black ${data.score < 50 ? 'text-[#ba1a1a]' : 'text-primary'}`}>{Math.round(data.score)}</span>
                  </div>
                </div>
                <div className={`${data.score < 50 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-primary-container text-primary'} px-3 py-1 rounded-full mb-1`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{getBandLabel(data.band || (data.score > 70 ? 'Excellent' : 'Critical'))}</span>
                </div>
              </div>
              
              {/* Algorithmic Fraud Shield Card */}
              <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm border border-outline-variant/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-blue-600" /> {t('health.fraudShield')}</p>
                <div className="relative flex items-center justify-center mb-4">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-surface-container stroke-[8]" cx="50" cy="50" r="40"></circle>
                    <circle className={`fill-none stroke-[8] ${data.fraudScore > 80 ? 'stroke-[#ba1a1a]' : 'stroke-blue-500'}`} strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`calc(251.2 - (251.2 * ${data.fraudScore || 0}) / 100)`} cx="50" cy="50" r="40"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface">
                    <span className={`text-3xl font-black ${data.fraudScore > 80 ? 'text-[#ba1a1a]' : 'text-blue-600'}`}>{Math.round(data.fraudScore || 0)}</span>
                  </div>
                </div>
                <div className={`${data.fraudScore > 80 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-blue-100 text-blue-800'} px-3 py-1 rounded-full mb-1`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{data.fraudScore > 80 ? t('health.riskAlert') : t('health.highSecurity')}</span>
                </div>
              </div>
            </section>
            )}

            {/* EMI Transaction Logs */}
            {(activeTab === 'dashboard' || activeTab === 'emi') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-on-surface">{t('emi.title')}</h3>
                <button className="text-primary text-sm font-bold flex items-center gap-1">
                  {t('emi.viewStatement')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-surface-container-low rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 px-8 py-4 border-b border-outline-variant/10 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  <div>{t('emi.date')}</div>
                  <div>{t('emi.description')}</div>
                  <div>{t('emi.amount')}</div>
                  <div className="text-right">{t('emi.status')}</div>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {(data.emiSchedule || []).slice().sort((a,b) => {
                    if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
                    if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
                    if (a.status === 'PENDING' && b.status === 'PAID') return -1;
                    if (b.status === 'PENDING' && a.status === 'PAID') return 1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                  }).map((txn, idx) => (
                    <div key={idx} className="grid grid-cols-4 px-8 py-5 items-center hover:bg-surface-container-high transition-colors text-on-surface">
                      <div className="text-sm">{new Date(txn.dueDate).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-sm font-medium">
                         {txn.description || `EMI ${txn.emiId}`}
                         {txn.isRestructured && <span className="block mt-1 text-[10px] text-green-700 bg-green-50 w-max px-2 py-0.5 rounded-full font-bold">{t('emi.restructured')}</span>}
                      </div>
                      <div className="text-sm font-bold flex flex-col items-start gap-1">
                        {txn.isRestructured && txn.originalAmount && (
                          <span className="text-rose-400 line-through text-[10px]">₹{txn.originalAmount.toLocaleString('en-IN')}</span>
                        )}
                        <span className={txn.isRestructured ? 'text-green-800 font-black' : ''}>₹{txn.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-right flex items-center justify-end gap-3 w-full">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${txn.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : txn.status === 'OVERDUE' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-tertiary-fixed text-on-tertiary-container'}`}>
                          {getStatusLabel(txn.status)}
                        </span>
                        {txn.status !== 'PAID' && (
                          <button onClick={() => onPayEmi(txn.emiId)} className="bg-primary text-on-primary text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-primary/20 hover:opacity-90 transition-opacity">
                            {t('emi.payNow')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!data.emiSchedule || data.emiSchedule.length === 0) && (
                    <div className="px-8 py-8 text-center text-on-surface-variant text-sm font-medium">{t('emi.noEmi')}</div>
                  )}
                </div>
              </div>
            </section>
            )}

            {/* Support Section */}
            {(activeTab === 'dashboard' || activeTab === 'support') && (
            <section className="space-y-6">
              <h3 className="text-xl font-bold tracking-tight text-on-surface">{t('support.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FAQ Card 1 */}
                <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-primary mb-4">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-on-surface mb-2">{t('support.prepayTitle')}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{t('support.prepayDesc')}</p>
                </div>
                {/* FAQ Card 2 */}
                <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-primary mb-4">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-on-surface mb-2">{t('support.changeBankTitle')}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{t('support.changeBankDesc')}</p>
                </div>
                {/* Chat with Agent Card */}
                <div className="bg-emerald-950 p-6 rounded-2xl flex flex-col justify-between text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-bold mb-2">{t('support.directHelp')}</h4>
                    <p className="text-xs opacity-70 mb-6">{t('support.directHelpDesc')}</p>
                  </div>
                  <button onClick={openChatModal} className="relative z-10 w-full py-4 bg-white text-emerald-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    {t('support.chatWithAdmin')}
                  </button>
                  <div className="absolute -right-4 -bottom-4 opacity-10"><span className="material-symbols-outlined text-9xl">support_agent</span></div>
                </div>

                {/* Shock Simulator Card */}
                <div className="bg-[#ffdad6]/30 border border-[#ba1a1a]/10 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-[#ba1a1a] mb-2 flex gap-2 items-center tracking-tight"><AlertTriangle className="w-4 h-4"/> {t('shock.title')}</h4>
                    <p className="text-xs text-[#93000a]/80 mb-4">{t('shock.desc')}</p>
                  </div>
                  <button onClick={simulateMarketShock} disabled={shockLoading} className="w-full py-4 bg-[#ba1a1a] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
                    {shockLoading ? t('shock.processing') : t('shock.button')}
                  </button>
                </div>
              </div>
            </section>
            )}
          </div>
        </div>
      </main>

      {/* Language Toggle */}
      <LanguageToggle />

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
           <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-[#131e17] p-4 flex justify-between items-center px-6">
                <div>
                  <h3 className="text-white font-bold leading-tight">{t('chat.title')}</h3>
                  <p className="text-gray-400 text-xs font-bold tracking-widest uppercase text-[10px] mt-0.5">{t('chat.subtitle')}</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 bg-surface flex-1 overflow-y-auto max-h-[400px] flex flex-col gap-4">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/60 text-center py-4 italic font-medium">{t('chat.noPrior')}</p>
                ) : (
                  chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 px-5 rounded-2xl max-w-[85%] text-sm font-medium ${m.sender === 'CUSTOMER' ? 'bg-emerald-900 text-emerald-50 rounded-br-none shadow-md' : 'bg-emerald-50 text-emerald-950 rounded-bl-none border border-emerald-100'}`}>{m.text}</div>
                    </div>
                  ))
                )}
             </div>
             <div className="p-4 bg-emerald-50/30 border-t border-emerald-100">
                <div className="flex gap-2 items-center bg-white p-2 border-2 border-emerald-100 rounded-2xl focus-within:border-emerald-600 transition-all">
                  <input 
                     type="text"
                     placeholder={t('chat.placeholder')}
                     value={chatMessage}
                     onChange={e => setChatMessage(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && submitChat()}
                     className="flex-1 bg-transparent border-none text-on-surface text-sm focus:outline-none focus:ring-0 px-2"
                  />
                  <button disabled={chatSending || !chatMessage.trim()} onClick={submitChat} className="p-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors disabled:opacity-50 shadow-lg">
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
