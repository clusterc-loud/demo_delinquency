import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Send, CheckCircle, UserCheck, MessageSquare, Zap } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const MOCK_QUEUE = [
  {
    id: 'VC-18842',
    name: 'Global Logistics Pvt Ltd',
    segment: 'MSME',
    priority: 'P1',
    slaHours: 0.5,
    healthScore: 38,
    interventionType: 'Restructuring Advisory',
  },
  {
    id: 'VC-82910',
    name: 'Rajesh Malhotra',
    segment: 'Retail',
    priority: 'P2',
    slaHours: 3.5,
    healthScore: 44,
    interventionType: 'Payment Reminder',
  },
  {
    id: 'VC-33180',
    name: 'Celestial Ventures Ltd',
    segment: 'MSME',
    priority: 'P2',
    slaHours: 7,
    healthScore: 55,
    interventionType: 'Proactive Outreach',
  },
  {
    id: 'VC-45512',
    name: 'Priya Mehta',
    segment: 'Retail',
    priority: 'P3',
    slaHours: 16,
    healthScore: 65,
    interventionType: 'Educational Notice',
  },
];

const MOCK_MESSAGE = `Dear Rajesh Malhotra,

This is a proactive communication from VittChetak Financial Intelligence in support of your account with your institution.

Our AI analytics have detected early warning signs in your account's financial health. As a valued customer, we want to ensure you remain on track with your financial goals.

Key Signal: Salary reduction and elevated EMI burden detected.

We are committed to helping you navigate any financial challenges. Please reach out at your earliest convenience to discuss tailored solutions.`;

function SLACountdown({ hours }) {
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

function TypewriterText({ text, delay = 0 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let charIndex = 0;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (charIndex <= text.length) {
          setDisplayedText(text.slice(0, charIndex));
          charIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, 18);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <pre className="whitespace-pre-wrap font-body text-sm text-[#131e17] leading-relaxed">
      {displayedText}
      {!isComplete && <span className="inline-block w-0.5 h-4 bg-[#006e2d] animate-pulse align-middle ml-0.5" />}
    </pre>
  );
}

export default function InterventionQueue() {
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [selected, setSelected] = useState(MOCK_QUEUE[0]);
  const [message, setMessage] = useState('');
  const [activeType, setActiveType] = useState('SMS');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
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
      setMessage(data?.message || MOCK_MESSAGE);
    } catch {
      setMessage(MOCK_MESSAGE);
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (selected) generateMessage(selected);
  }, [selected]);

  useEffect(() => {
    api.get('/interventions/queue').then(({ data }) => {
      if (data?.queue) setQueue(data.queue);
    }).catch(() => {});
  }, []);

  const handleApprove = async () => {
    setSendingTo(selected.id);
    try {
      await api.post(`/interventions/${selected.id}/approve`, { type: activeType, message });
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
      <main className="ml-64 flex h-screen">
        {/* Left Queue Panel */}
        <div className="w-[40%] border-r border-[#e4f1e5] flex flex-col">
          <div className="p-6 border-b border-[#e4f1e5]">
            <h1 className="text-2xl font-extrabold text-[#131e17]">Intervention Queue</h1>
            <p className="text-sm text-[#3d4a3d] mt-1">{queue.length} accounts awaiting action</p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {queue.map((item) => (
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

            {/* Message Preview */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#eaf7eb]">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#006e2d]" />
                <span className="text-xs font-bold text-[#3d4a3d] uppercase tracking-widest">AI-Generated {activeType} Preview</span>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm min-h-[280px]">
                {generating ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-3 shimmer rounded-full" style={{ width: `${70 + Math.random() * 30}%` }} />
                    ))}
                  </div>
                ) : (
                  <TypewriterText text={message} />
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="border-t border-[#e4f1e5] px-8 py-5 bg-white flex justify-between items-center">
              <button
                onClick={handleRouteRM}
                className="flex items-center gap-2 text-sm font-bold text-[#3d4a3d] px-4 py-2 rounded-xl hover:bg-[#eaf7eb] transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Route to Counsellor
              </button>
              <div className="flex gap-3">
                <button
                  onClick={generateMessage.bind(null, selected)}
                  className="text-sm font-bold px-4 py-2 rounded-xl border border-[#bccbb9] hover:bg-[#eaf7eb] transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleApprove}
                  disabled={sendingTo === selected.id || generating}
                  className="flex items-center gap-2 bg-[#006e2d] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#004118] transition-colors disabled:opacity-60"
                >
                  {sendingTo === selected.id ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Approve & Send
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
