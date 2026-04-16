import React, { useState } from 'react';
import { Search, Bell, Settings, ArrowRight, HelpCircle, Wallet, MessageSquare, LogOut, ShieldAlert, HeartPulse, X, Send, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';

export default function RetailDashboard({ data, loading, onHelpSelect, onPayEmi, onSimulate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSending, setChatSending] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/customer-login');
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
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'dashboard' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('emi')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'emi' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span>EMI Transactions</span>
          </button>
          <button onClick={() => setActiveTab('health')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'health' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">health_and_safety</span>
            <span>Financial Health</span>
          </button>
          <button onClick={() => setActiveTab('support')} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${activeTab === 'support' ? 'text-green-700 dark:text-green-300 border-r-4 border-green-600 bg-emerald-100/50 dark:bg-emerald-900/20' : 'text-emerald-800/70 hover:text-green-600 hover:bg-emerald-100'}`}>
            <span className="material-symbols-outlined">help_center</span>
            <span>Support Hub</span>
          </button>
        </nav>
        <div className="mt-auto px-4 pb-4">
          <div className="mt-6 px-4 flex items-center gap-3">
            <img alt="User profile photo" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt530Pm_OOXTQ2YTDeTI1SvWDHvy_c30n2kP0Yd7Yv_PCdTbFPKc4DUkc6-pgWSbrkouskKfTAJ5D1wfyoLUf99pJjMsZlMv8G3BtWeoxZTUW4rSnWOA9L_FQjzgEF_2MS2wRYJBdXA5Y1t0AWoLcBbe3m2TNSQpXrXBpoQ_TRmA2lo58qB4lN76tRu1beHuURqvRmeb5Q06_jFG_I4hqAMnqPysu6rk2gvmfGrhZk3TC5kEwpcALQRRvQvTVPVWij_tE8-Km7wQ"/>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{data.name}</p>
              <p className="text-[10px] text-on-surface-variant">Growth Member</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-4 text-emerald-800/70 dark:text-emerald-200/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-green-600 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-bold">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface relative">
        <header className="flex justify-between items-center w-full px-8 py-3 bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 transition-all font-['Plus_Jakarta_Sans'] text-sm">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
              <input className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-on-surface-variant/60" placeholder="Search transactions or tools..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img alt="User avatar" className="w-8 h-8 rounded-full border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtTJ23MDex2bCgpwE7AeG44iS3OkUEa-77kOeGBG_XvyoiJomQ59O-3kBu4c_hYo0Aq8ODiC8-1f9fvBsJFZLmbwyMvmKRyvqIPXzH2EiDsnazIA0xuF0M5YcPs8oxwI-_hAWx2Ppe4JfYhhE246FvPN230s6uzfDjAgTii23ZcSBgzirjPofcHUKXonWORPe_0U2A5mFNn7kXLmrf-9c_usryhzZ6z_y8K6Ty9lMwgWEEmIhuiPVmVtPS4z1MxvtbZHirJcG6Sg"/>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* AI Proactive Banner */}
          {(data.score < 50 || (data.emiSchedule && data.emiSchedule.some(e => e.status === 'OVERDUE'))) && (
            <div className="bg-[#ffdad6] border-[1.5px] border-[#ba1a1a]/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#ba1a1a]/5 rounded-full blur-2xl font-bold animate-pulse" />
               <div className="relative z-10 w-full">
                 <h3 className="font-bold text-[#ba1a1a] flex items-center gap-2 text-lg">
                   🚨 AI Proactive Risk Alert
                 </h3>
                 <p className="text-sm text-[#93000a] mt-1 pr-4 font-medium">
                   Anomalous liquidity patterns detected. Our ML Engine suggests urgent EMI restructuring to prevent default. Contact support now.
                 </p>
               </div>
               <button onClick={onHelpSelect} className="shrink-0 bg-[#ba1a1a] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-[#93000a] transition-colors whitespace-nowrap relative z-10">
                 Intervene Now
               </button>
            </div>
          )}

          <div className="space-y-8 pb-12">
            {(activeTab === 'dashboard' || activeTab === 'health') && (
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#004f20] to-[#006e2d] rounded-lg p-8 text-on-primary flex flex-col justify-between min-h-[240px] relative overflow-hidden shadow-xl shadow-[#004f20]/20">
                 <div className="relative z-10">
                   <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">Welcome back, {data.name?.split(' ')[0]}</h2>
                   <p className="text-emerald-100 max-w-md text-sm">Financial health actively monitored via VittChetak ML. Audit logs synced.</p>
                 </div>
                 <div className="relative z-10 flex gap-8 mt-8">
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-[#72fe8f] font-bold">Total Debt</p>
                     <p className="text-3xl font-black mt-1 tracking-tight text-white">₹{data.mlFeatures?.retail?.creditAmount?.toLocaleString() || '4,20,000'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-[#72fe8f] font-bold">Status</p>
                     <p className="text-3xl font-black mt-1 tracking-tight text-white">{data.score < 50 ? 'DISTRESSED' : 'HEALTHY'}</p>
                   </div>
                 </div>
                 <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#72fe8f]/10 rounded-full blur-3xl" />
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm border border-outline-variant/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-1"><HeartPulse className="w-3 h-3 text-primary" /> Risk Meter</p>
                <div className="relative flex items-center justify-center mb-4">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-surface-container stroke-[8]" cx="50" cy="50" r="40" />
                    <circle className={`fill-none stroke-[8] ${data.score < 50 ? 'stroke-[#ba1a1a]' : 'stroke-primary'}`} strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`calc(251.2 - (251.2 * ${data.score}) / 100)`} cx="50" cy="50" r="40" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-3xl">{Math.round(data.score)}</div>
                </div>
                <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase ${data.score < 50 ? 'bg-error-container text-error' : 'bg-primary-container text-primary'}`}>
                   {data.band || (data.score > 70 ? 'EXCELLENT' : 'CRITICAL')}
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm border border-outline-variant/10">
                 <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-blue-600" /> Fraud Shield</p>
                 <div className="relative flex items-center justify-center mb-4">
                   <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                     <circle className="fill-none stroke-surface-container stroke-[8]" cx="50" cy="50" r="40" />
                     <circle className={`fill-none stroke-[8] ${data.fraudScore > 80 ? 'stroke-error' : 'stroke-blue-500'}`} strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`calc(251.2 - (251.2 * ${data.fraudScore || 0}) / 100)`} cx="50" cy="50" r="40" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center font-black text-3xl">{Math.round(data.fraudScore || 0)}</div>
                 </div>
                 <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase ${data.fraudScore > 80 ? 'bg-error-container text-error' : 'bg-blue-100 text-blue-700'}`}>
                    {data.fraudScore > 80 ? 'RISK ALERT' : 'SECURED'}
                 </div>
              </div>
            </section>
            )}

            {(activeTab === 'dashboard' || activeTab === 'emi') && (
            <section className="space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-on-surface">EMI Transaction Logs</h3>
              <div className="bg-surface-container-low rounded-lg overflow-hidden divide-y divide-outline-variant/10">
                 {(data.emiSchedule || []).map((txn, idx) => (
                   <div key={idx} className="grid grid-cols-4 px-8 py-5 items-center hover:bg-surface-container-high transition-colors">
                      <div className="text-sm">{new Date(txn.dueDate).toLocaleDateString()}</div>
                      <div className="text-sm font-medium">
                        {txn.description || `EMI ${txn.emiId}`}
                        {txn.isRestructured && <span className="block text-[10px] text-green-700 font-bold">RESTRUCTURED ✓</span>}
                      </div>
                      <div className="text-sm font-bold">₹{txn.amount.toLocaleString('en-IN')}</div>
                      <div className="text-right flex items-center justify-end gap-3">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${txn.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>{txn.status}</span>
                         {txn.status !== 'PAID' && <button onClick={() => onPayEmi(txn.emiId)} className="bg-primary text-on-primary text-[10px] px-3 py-1.5 rounded-lg font-bold">PAY</button>}
                      </div>
                   </div>
                 ))}
              </div>
            </section>
            )}

            {(activeTab === 'dashboard' || activeTab === 'support') && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                <h3 className="text-xl font-headline font-bold mb-4">Simulation Sandbox</h3>
                <div className="space-y-4">
                  <button onClick={() => onSimulate('MISS_EMI')} className="w-full p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold flex items-center justify-between group hover:bg-rose-100 transition-all">
                    <div className="flex items-center gap-3"><span className="material-symbols-outlined">money_off</span><span>Simulate High-Risk Shock</span></div>
                    <span className="material-symbols-outlined transition-all group-hover:translate-x-1">arrow_forward</span>
                  </button>
                  <button onClick={() => onSimulate('FRAUD_ALERT')} className="w-full p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold flex items-center justify-between group hover:bg-amber-100 transition-all">
                    <div className="flex items-center gap-3"><span className="material-symbols-outlined">security_update_warning</span><span>Simulate Identity Theft</span></div>
                   <span className="material-symbols-outlined transition-all group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-emerald-950 text-white flex flex-col justify-between overflow-hidden relative">
                 <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Dedicated Helpdesk</h3>
                    <p className="text-sm text-emerald-100/70 mb-6">Need assistance with your restructuring? Our specialists are available 24/7.</p>
                 </div>
                 <button onClick={openChatModal} className="relative z-10 w-full py-4 bg-white text-emerald-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors">
                    <MessageSquare className="w-4 h-4" /> Chat with Account Manager
                 </button>
                 <div className="absolute -right-4 -bottom-4 opacity-10"><span className="material-symbols-outlined text-9xl">support_agent</span></div>
              </div>
            </section>
            )}
          </div>
        </div>
      </main>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
           <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-[#131e17] p-4 flex justify-between items-center px-6">
                <div>
                  <h3 className="text-white font-bold leading-tight">Bank Admin Communication</h3>
                  <p className="text-gray-400 text-xs text-[10px] uppercase font-bold tracking-widest">Audit Secure Channel</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 bg-surface-container-lowest flex-1 overflow-y-auto max-h-[400px] flex flex-col gap-4">
                {chatHistory.length === 0 ? <p className="text-sm text-gray-500 text-center py-4 italic">No prior communication.</p> : 
                  chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 px-4 rounded-xl max-w-[85%] text-sm ${m.sender === 'CUSTOMER' ? 'bg-emerald-900 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>{m.text}</div>
                    </div>
                ))}
             </div>
             <div className="p-4 border-t border-outline-variant/10">
                <div className="flex gap-2 items-center bg-surface-container-high p-2 rounded-xl">
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
