import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Send, CheckCircle, UserCheck, MessageSquare, Zap, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationPanel';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import api from '../api/axios';

export function SLACountdown({ hours }) {
  const totalMs = hours * 3600 * 1000;
  const [remaining, setRemaining] = useState(totalMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  const color = h < 1 ? 'text-[#ba1a1a]' : h < 4 ? 'text-amber-600' : 'text-[#006e2d]';
  const bg = h < 1 ? 'bg-[#ffdad6]/40' : h < 4 ? 'bg-yellow-100' : 'bg-[#72fe8f]/20';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bg}`}>
      <Clock className={`w-3 h-3 ${color}`} />
      <span className={`text-[10px] font-black tabular-nums ${color}`}>
        {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

export default function InterventionQueue() {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [activeType, setActiveType] = useState('SMS');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [restructurePlan, setRestructurePlan] = useState(null);
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      const found = queue.find((q) => q.id === customerId);
      if (found) setSelected(found);
    }
  }, [searchParams]);

  const generateMessage = useCallback(async (customer) => {
    setGenerating(true);
    setMessage('');
    try {
      const { data } = await api.get(`/interventions/${customer.id}/generate-message`);
      setMessage(data?.message || 'Default system message generated.');
      if (data?.restructurePreview) {
        setRestructurePlan(data.restructurePreview);
      } else {
        setRestructurePlan(null);
      }
    } catch {
      setMessage('Fallback generic message generated for Restructure processing.');
      setRestructurePlan(null);
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    let chatInterval;
    if (selected) {
      generateMessage(selected);
      // Fetch dynamic chat history
      const fetchChat = () => {
        api.get(`/chat/${selected.id}`).then(res => {
          setChatHistory(res.data.messages || []);
        }).catch(() => setChatHistory([]));
      };
      
      fetchChat();
      chatInterval = setInterval(fetchChat, 3000); // Poll every 3s for live feel
    }
    return () => {
      if (chatInterval) clearInterval(chatInterval);
    };
  }, [selected, generateMessage]);

  const handleSendChat = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      const res = await api.post(`/chat/${selected.id}`, { sender: 'ADMIN', text: replyText });
      setChatHistory(res.data.messages);
      setReplyText('');
      addToast('Reply sent.', 'success');
    } catch {
      addToast('Failed to send reply.', 'error');
    } finally {
      setReplying(false);
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/interventions/queue');
      if (data?.queue) {
        setQueue(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data.queue)) {
             // Play notification sound visually or via toast if a P1 triggers
             const hasNewP1 = data.queue.some(q => q.priority === 'P1' && !prev.find(p => p.id === q.id));
             if (hasNewP1) addToast('New Priority Intervention Received!', 'error');
             return data.queue;
          }
          return prev;
        });
      }
    } catch (err) {}
  }, [addToast]);

  useEffect(() => {
    fetchQueue();
    const inv = setInterval(fetchQueue, 5000);
    return () => clearInterval(inv);
  }, [fetchQueue]);

  const handleApprove = async () => {
    setSendingTo(selected.id);
    try {
      await api.post(`/interventions/${selected.id}/approve`, { 
        channel: activeType === 'In-App' ? 'APP' : activeType.toUpperCase(), 
        messagePreview: message, 
        interventionType: selected.interventionType,
        approvedBy: 'ADMIN_HACKATHON',
        planDetails: (selected.interventionType === 'EMI_RESTRUCTURE' || selected.interventionType === 'PAYMENT_HOLIDAY') ? restructurePlan : null
      });
      addToast(`Intervention sent to ${selected.name}`, 'success');
      setQueue((prev) => prev.filter((q) => q.id !== selected.id));
      setSelected(queue.find((q) => q.id !== selected.id) || null);
    } catch {
      addToast('Failed to send intervention.', 'error');
    } finally {
      setSendingTo(null);
    }
  };

  const handleRouteRM = async () => {
    try {
      await api.post(`/interventions/${selected.id}/route-to-rm`);
      addToast(`Routed ${selected.name} to Relationship Manager`, 'warning');
    } catch {
      addToast('Failed to route.', 'error');
    }
  };

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 flex h-screen overflow-hidden">
        {/* Left Queue Panel */}
        <div className="w-[40%] border-r border-[#e4f1e5] flex flex-col">
          <div className="p-6 border-b border-[#e4f1e5]">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-extrabold text-[#131e17]">Intervention Queue</h1>
                <p className="text-sm text-[#3d4a3d] mt-1">{queue.length} accounts awaiting action</p>
              </div>
              <NotificationBell />
            </div>
            <div className="mt-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#1db954]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {(queue || []).filter(q => 
              (q.name || "").toLowerCase().includes((searchTerm || "").toLowerCase()) || 
              (q.id || "").toString().includes(searchTerm || "")
            ).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className={`p-5 border-b border-[#e4f1e5] cursor-pointer transition-all ${selected?.id === item.id ? 'bg-[#eaf7eb] border-l-4 border-l-[#1db954]' : 'hover:bg-[#f0fdf1]/60'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-[10px] text-[#3d4a3d] font-medium">{item.id} · {item.interventionType}</p>
                  </div>
                  <SLACountdown hours={item.slaHours} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.priority === 'P1' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.priority}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.segment === 'MSME' ? 'bg-[#1db954]/20 text-[#004118]' : 'bg-[#d9e3fb] text-[#2e384b]'}`}>
                    {item.segment}
                  </span>
                  <span className={`text-sm font-black ml-auto ${item.healthScore < 40 ? 'text-[#ba1a1a]' : item.healthScore < 60 ? 'text-yellow-600' : 'text-[#006e2d]'}`}>
                    {item.healthScore}
                  </span>
                </div>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="p-8 text-center text-[#3d4a3d]">
                <CheckCircle className="w-12 h-12 text-[#1db954] mx-auto mb-3" />
                <p className="font-bold">All caught up!</p>
                <p className="text-sm mt-1">No interventions pending.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Message Panel */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            {/* Customer header */}
            <div className="bg-[#131e17] px-8 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                <p className="text-xs text-gray-400">{selected.id} · Health Score: {selected.healthScore}</p>
              </div>
              <div className="flex gap-3">
                {['SMS', 'Email', 'In-App'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${activeType === type ? 'bg-[#1db954] text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto p-8 bg-[#eaf7eb] ${restructurePlan ? 'pt-4' : ''}`}>
              {/* Dynamic Chat History */}
              <div className="mb-8 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-[#006e2d]" />
                  <span className="text-xs font-bold text-[#3d4a3d] uppercase tracking-widest">Live Chat History</span>
                </div>
                {chatHistory.length > 0 ? chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${m.sender === 'ADMIN' ? 'bg-[#1db954] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                      <div className="text-[10px] font-bold opacity-70 mb-1">{m.sender}</div>
                      <div className="text-sm">{m.text}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-400 text-sm">No active chat history. Send a message to initiate communication.</div>
                )}
                <div className="mt-4 flex gap-2">
                  <input 
                    type="text" 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    placeholder="Type a direct reply..."
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm"
                  />
                  <button onClick={handleSendChat} disabled={replying} className="bg-[#1db954] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#159a43]">
                     <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Restructuring Workshop (If applicable) */}
              {restructurePlan && (
                <div className="mb-8 p-6 bg-white rounded-xl border-2 border-[#1db954]/20 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5"><Zap className="w-16 h-16" /></div>
                  <h3 className="text-sm font-black text-[#131e17] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Restructuring Workshop (Editable)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest block mb-1">Original EMI</label>
                      <p className="text-sm font-black text-gray-400">₹{restructurePlan.originalEmi.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest block mb-1">Proposed EMI</label>
                      <input 
                        type="number" 
                        value={restructurePlan.revisedEmi} 
                        onChange={e => setRestructurePlan({...restructurePlan, revisedEmi: Number(e.target.value)})}
                        className="bg-[#f0fdf1] border-none rounded-lg px-3 py-1 text-sm font-black w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest block mb-1">Extension (Months)</label>
                      <input 
                        type="number" 
                        value={restructurePlan.tenureExtensionMonths} 
                        onChange={e => setRestructurePlan({...restructurePlan, tenureExtensionMonths: Number(e.target.value)})}
                        className="bg-[#f0fdf1] border-none rounded-lg px-3 py-1 text-sm font-black w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest block mb-1">Projected Score Recovery</label>
                      <p className="text-sm font-black text-[#006e2d]">+{Math.round((1 - restructurePlan.revisedEmi/restructurePlan.originalEmi) * 100)}% Boost</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest block mb-1">Explainability Logic (Sent to Customer)</label>
                    <textarea 
                      value={restructurePlan.logic}
                      onChange={e => setRestructurePlan({...restructurePlan, logic: e.target.value})}
                      className="w-full bg-[#f0fdf1] border-none rounded-lg px-4 py-2 text-xs italic leading-relaxed"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 mt-8">
                <Zap className="w-4 h-4 text-[#006e2d]" />
                <span className="text-xs font-bold text-[#3d4a3d] uppercase tracking-widest">AI-Generated {activeType} Reply Preview</span>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm min-h-[200px]">
                {generating ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-3 shimmer rounded-full" style={{ width: `${70 + Math.random() * 30}%` }} />
                    ))}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-body text-sm text-[#131e17] leading-relaxed">
                    {message}
                  </pre>
                )}
              </div>
            </div>            {/* Action Footer - High Contrast Floating Bar */}
            <div className="border-t border-emerald-900 bg-[#062411] px-10 py-6 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
              <button
                onClick={handleRouteRM}
                className="flex items-center gap-2 text-sm font-bold text-emerald-100/70 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Route to Counsellor
              </button>
              <div className="flex gap-4">
                <button
                  onClick={generateMessage.bind(null, selected)}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl border border-emerald-700/50 text-emerald-100 hover:bg-emerald-900 transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleApprove}
                  disabled={sendingTo === selected.id || generating}
                  className="flex items-center gap-3 bg-[#1db954] text-white text-sm font-black px-8 py-3 rounded-xl hover:bg-[#159a43] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {sendingTo === selected.id ? (
                    <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  APPROVE & SEND
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#3d4a3d]">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Select an account from the queue</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
