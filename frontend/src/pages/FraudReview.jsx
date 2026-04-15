import { useState, useEffect } from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const MOCK_FRAUD_ACCOUNTS = [
  {
    id: 'FRD-882',
    name: 'Apex Manufacturing Ltd',
    fraudScore: 91,
    signals: ['Circular Money Flow', 'Ghost Invoice', 'Shell Entity'],
    amount: '₹1.2 Cr',
    type: 'Corporate',
  },
  {
    id: 'FRD-750',
    name: 'TechStar Imports Pvt',
    fraudScore: 78,
    signals: ['GST Mismatch', 'Undeclared Income'],
    amount: '₹48L',
    type: 'MSME',
  },
  {
    id: 'FRD-641',
    name: 'Pradeep & Associates',
    fraudScore: 65,
    signals: ['Frequency Anomaly'],
    amount: '₹18L',
    type: 'Retail',
  },
];

const MOCK_TREND = [
  { month: 'Apr', legit: 800, fraud: 20 },
  { month: 'May', legit: 850, fraud: 30 },
  { month: 'Jun', legit: 820, fraud: 25 },
  { month: 'Jul', legit: 780, fraud: 55 },
  { month: 'Aug', legit: 810, fraud: 80 },
  { month: 'Sep', legit: 760, fraud: 91 },
];

const RISK_BREAKDOWN = [
  { label: 'Circular Fund Flow', score: 91, color: 'bg-[#ba1a1a]' },
  { label: 'Shell Entity Linkage', score: 78, color: 'bg-[#ba1a1a]/60' },
  { label: 'Transaction Spiking', score: 65, color: 'bg-yellow-400' },
  { label: 'Undisclosed Liabilities', score: 43, color: 'bg-[#1db954]/60' },
  { label: 'Geographic Anomaly', score: 30, color: 'bg-[#d9e6da]' },
];

export default function FraudReview() {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState(MOCK_FRAUD_ACCOUNTS);
  const [selected, setSelected] = useState(MOCK_FRAUD_ACCOUNTS[0]);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState(null);

  useEffect(() => {
    api.get('/fraud').then(({ data }) => {
      if (data?.accounts) {
        setAccounts(data.accounts.map(a => {
          let signalArray = [];
          if (a.indicatorsTriggered) {
             signalArray = Object.entries(a.indicatorsTriggered)
               .filter(([_, isTriggered]) => isTriggered)
               .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
          }
          return {
            id: a.customerId,
            name: a.customerName,
            fraudScore: a.fraudScore,
            signals: signalArray,
            amount: '₹0L', // Mock value since backend does not provide amounts
            type: a.customerType
          };
        }));
      }
    }).catch(() => {});
  }, []);

  const handleDecision = async (decision) => {
    setDeciding(decision);
    try {
      await api.patch(`/fraud/${selected.id}/decision`, { decision });
      addToast(`Case ${selected.name} marked as ${decision}`, 'success');
      setAccounts((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(accounts.find((a) => a.id !== selected.id) || null);
    } catch {
      addToast('Failed to submit decision.', 'error');
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#131e17]">Fraud Review Panel</h1>
          <p className="text-[#3d4a3d] mt-1">Active investigation cases requiring analyst review</p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Account List */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelected(acc)}
                className={`bg-white rounded-xl p-5 cursor-pointer transition-all border ${selected?.id === acc.id ? 'border-[#ba1a1a]/40 shadow-md' : 'border-[#bccbb9]/10 hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-sm">{acc.name}</p>
                    <p className="text-[10px] text-[#3d4a3d] font-medium">{acc.id} · {acc.type}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3d4a3d]" />
                </div>
                {/* Fraud Score Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="uppercase tracking-widest text-[#3d4a3d]">Fraud Score</span>
                    <span className={acc.fraudScore >= 70 ? 'text-[#ba1a1a]' : 'text-yellow-600'}>{acc.fraudScore}%</span>
                  </div>
                  <div className="h-2 bg-[#e4f1e5] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${acc.fraudScore >= 70 ? 'bg-[#ba1a1a] fraud-pulse' : 'bg-yellow-400'}`}
                      style={{ width: `${acc.fraudScore}%` }}
                    />
                  </div>
                </div>
                {/* Signal Chips */}
                <div className="flex flex-wrap gap-1">
                  {acc.signals.map((s) => (
                    <span key={s} className="text-[10px] font-bold bg-[#ffdad6]/40 text-[#93000a] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Evidence Panel */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {selected ? (
              <>
                {/* Case Header */}
                <div className="bg-[#131e17] rounded-xl p-6 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-5 h-5 text-[#ba1a1a]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Case ID {selected.id}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">Exposure: {selected.amount} · Fraud Score: {selected.fraudScore}%</p>
                  </div>
                  {/* Decision Buttons */}
                  <div className="flex gap-2">
                    {[
                      { label: 'Genuine', type: 'Genuine', color: 'bg-[#1db954]' },
                      { label: 'Suspicious', type: 'Suspicious', color: 'bg-yellow-500' },
                      { label: 'Escalate', type: 'Escalate', color: 'bg-[#ba1a1a]' },
                    ].map(({ label, type, color }) => (
                      <button
                        key={type}
                        onClick={() => handleDecision(type)}
                        disabled={!!deciding}
                        className={`${color} text-white text-xs font-black px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50`}
                      >
                        {deciding === type ? '...' : label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
                  <h3 className="font-bold text-[#131e17] mb-5">Risk Signal Breakdown</h3>
                  <div className="space-y-4">
                    {RISK_BREAKDOWN.map(({ label, score, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold">{label}</span>
                          <span className="font-black">{score}%</span>
                        </div>
                        <div className="h-2 bg-[#e4f1e5] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction Flow SVG */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
                  <h3 className="font-bold text-[#131e17] mb-4">Suspicious Money Flow Network</h3>
                  <svg viewBox="0 0 600 240" className="w-full h-48">
                    {/* Entity circles */}
                    <circle cx="80" cy="120" r="30" fill="#e4f1e5" stroke="#006e2d" strokeWidth="2" />
                    <text x="80" y="124" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#006e2d">Source</text>

                    <circle cx="220" cy="60" r="25" fill="#ffdad6" stroke="#ba1a1a" strokeWidth="2" />
                    <text x="220" y="64" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ba1a1a">Shell A</text>

                    <circle cx="220" cy="180" r="25" fill="#ffdad6" stroke="#ba1a1a" strokeWidth="2" />
                    <text x="220" y="184" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ba1a1a">Shell B</text>

                    <circle cx="380" cy="120" r="28" fill="#ffedd5" stroke="#f59e0b" strokeWidth="2" />
                    <text x="380" y="124" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#b45309">Apex MFG</text>

                    <circle cx="520" cy="120" r="25" fill="#ffdad6" stroke="#ba1a1a" strokeWidth="3" />
                    <text x="520" y="124" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ba1a1a">Flagged</text>

                    {/* Flow paths */}
                    <path d="M 110 105 L 195 75" className="money-flow-dash" stroke="#ba1a1a" strokeWidth="2" fill="none" />
                    <path d="M 110 135 L 195 165" className="money-flow-dash" stroke="#ba1a1a" strokeWidth="2" fill="none" />
                    <path d="M 245 75 L 352 110" className="money-flow-dash" stroke="#ba1a1a" strokeWidth="2" fill="none" />
                    <path d="M 245 165 L 352 130" className="money-flow-dash" stroke="#ba1a1a" strokeWidth="2" fill="none" />
                    <path d="M 408 120 L 495 120" className="money-flow-dash" stroke="#ba1a1a" strokeWidth="3" fill="none" />

                    {/* Labels */}
                    <text x="145" y="80" fontSize="7" fill="#ba1a1a" fontWeight="bold">₹48L</text>
                    <text x="290" y="90" fontSize="7" fill="#ba1a1a" fontWeight="bold">₹1.2Cr</text>
                    <text x="450" y="115" fontSize="7" fill="#ba1a1a" fontWeight="bold">Destination</text>
                  </svg>
                </div>

                {/* Transaction Trend Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
                  <h3 className="font-bold text-[#131e17] mb-4">Transaction Volume Trend</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={MOCK_TREND}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4f1e5" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                        <Line type="monotone" dataKey="legit" stroke="#006e2d" strokeWidth={2} name="Legitimate" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="fraud" stroke="#ba1a1a" strokeWidth={2} name="Suspicious" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-16 text-center text-[#3d4a3d]">
                <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Select a case to view evidence</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
