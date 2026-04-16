import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ChevronRight, AlertTriangle, TrendingDown, Eye, Scale } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationPanel';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const STATUS_TABS = [
  { label: 'All Cases', value: '' },
  { label: 'Under Review', value: 'REVIEW' },
  { label: 'Suspicious', value: 'SUSPICIOUS' },
  { label: 'Escalated', value: 'ESCALATED' },
  { label: 'Cleared', value: 'CLEARED' },
];

const DECISION_BUTTONS = [
  { label: 'Clear', status: 'CLEARED', color: 'bg-[#1db954]', hoverColor: 'hover:bg-[#159a43]' },
  { label: 'Suspicious', status: 'SUSPICIOUS', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
  { label: 'Escalate', status: 'ESCALATED', color: 'bg-[#ba1a1a]', hoverColor: 'hover:bg-[#93000a]' },
];

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

// Dynamic SVG money flow renderer
function MoneyFlowGraph({ flowData }) {
  if (!flowData || flowData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No circular flow data available for this case.
      </div>
    );
  }

  // Extract unique entities
  const entities = new Set();
  flowData.forEach(f => { entities.add(f.from); entities.add(f.to); });
  const entityList = [...entities];

  // Position entities in a circle layout
  const cx = 300, cy = 120, radius = 90;
  const positions = entityList.map((name, i) => {
    const angle = (2 * Math.PI * i) / entityList.length - Math.PI / 2;
    return {
      name,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  const getPos = (name) => positions.find(p => p.name === name) || { x: 300, y: 120 };

  return (
    <svg viewBox="0 0 600 240" className="w-full h-48">
      {/* Flow arrows */}
      {flowData.map((flow, i) => {
        const from = getPos(flow.from);
        const to = getPos(flow.to);
        return (
          <g key={i}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="#ba1a1a" strokeWidth="2" strokeDasharray="6 3"
              className="animate-pulse"
            />
            <text
              x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}
              fontSize="8" fill="#ba1a1a" fontWeight="bold" textAnchor="middle"
            >
              {formatCurrency(flow.amount)}
            </text>
          </g>
        );
      })}
      {/* Entity nodes */}
      {positions.map((pos, i) => {
        const isSource = flowData.some(f => f.from === pos.name && !flowData.some(f2 => f2.to === pos.name));
        const isDest = flowData.some(f => f.to === pos.name && !flowData.some(f2 => f2.from === pos.name));
        const fill = isSource ? '#e4f1e5' : isDest ? '#ffdad6' : '#ffedd5';
        const stroke = isSource ? '#006e2d' : isDest ? '#ba1a1a' : '#f59e0b';
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="28" fill={fill} stroke={stroke} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="7" fontWeight="bold" fill={stroke}>
              {pos.name.length > 10 ? pos.name.slice(0, 10) + '…' : pos.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function FraudReview() {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [deciding, setDeciding] = useState(null);
  const [activeFilter, setActiveFilter] = useState('');

  // Fetch fraud stats
  useEffect(() => {
    api.get('/fraud/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  // Fetch cases
  const fetchCases = useCallback(async (statusFilter) => {
    setLoading(true);
    try {
      const url = statusFilter ? `/fraud?status=${statusFilter}` : '/fraud';
      const { data } = await api.get(url);
      if (data?.accounts) {
        const mapped = data.accounts.map(a => {
          let signalArray = [];
          if (a.indicatorsTriggered) {
            signalArray = Object.entries(a.indicatorsTriggered)
              .filter(([k, v]) => v && k !== '_id')
              .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()));
          }
          return {
            id: a.customerId,
            name: a.customerName || 'Unknown',
            fraudScore: a.fraudScore,
            signals: signalArray,
            exposure: a.exposure || 0,
            type: a.customerType,
            status: a.status,
          };
        });
        setAccounts(mapped);
        if (mapped.length > 0 && !selected) setSelected(mapped[0]);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(activeFilter);
  }, [activeFilter, fetchCases]);

  // Fetch evidence when selecting a case
  useEffect(() => {
    if (!selected) { setEvidence(null); return; }
    setEvidenceLoading(true);
    api.get(`/fraud/${selected.id}/evidence`).then(({ data }) => {
      setEvidence(data);
    }).catch(() => {
      setEvidence(null);
    }).finally(() => setEvidenceLoading(false));
  }, [selected]);

  const handleDecision = async (status) => {
    if (!selected) return;
    setDeciding(status);
    try {
      const { data } = await api.patch(`/fraud/${selected.id}/decision`, { decision: status });
      const label = status === 'CLEARED' ? 'Cleared' : status === 'SUSPICIOUS' ? 'Suspicious' : 'Escalated';
      const txMsg = data.txId ? ` | Blockchain TX: ${data.txId.slice(0, 12)}…` : '';
      addToast(`${selected.name} marked as ${label}${txMsg}`, 'success');
      setAccounts(prev => prev.filter(a => a.id !== selected.id));
      setSelected(accounts.find(a => a.id !== selected.id) || null);
      // Refresh stats
      api.get('/fraud/stats').then(({ data }) => setStats(data)).catch(() => {});
    } catch {
      addToast('Failed to submit decision.', 'error');
    } finally {
      setDeciding(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-[#ba1a1a]';
    if (score >= 40) return 'text-yellow-600';
    return 'text-[#006e2d]';
  };

  const getBarColor = (score) => {
    if (score >= 70) return 'bg-[#ba1a1a]';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-[#1db954]/60';
  };

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#131e17]">Fraud Review Panel</h1>
            <p className="text-[#3d4a3d] mt-1">Active investigation cases requiring analyst review</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="w-10 h-10 rounded-full bg-[#d9e6da] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-[#131e17] font-bold">
              A
            </div>
          </div>
        </header>

        {/* KPI Stats Bar */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Cases', value: stats.total, icon: <ShieldAlert className="w-4 h-4" />, bg: 'bg-white' },
              { label: 'Under Review', value: stats.review, icon: <Eye className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50' },
              { label: 'Suspicious', value: stats.suspicious, icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, bg: 'bg-yellow-50' },
              { label: 'Escalated', value: stats.escalated, icon: <TrendingDown className="w-4 h-4 text-[#ba1a1a]" />, bg: 'bg-[#ffdad6]/50' },
              { label: 'Avg. Score', value: `${stats.avgScore}%`, icon: <Scale className="w-4 h-4 text-[#006e2d]" />, bg: 'bg-[#eaf7eb]' },
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} rounded-xl p-4 border border-[#bccbb9]/10 shadow-sm`}>
                <div className="flex items-center gap-2 mb-1">
                  {kpi.icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#3d4a3d]">{kpi.label}</span>
                </div>
                <p className="text-2xl font-black text-[#131e17]">{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveFilter(tab.value); setSelected(null); }}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                activeFilter === tab.value
                  ? 'bg-[#131e17] text-white'
                  : 'bg-white text-[#3d4a3d] hover:bg-[#eaf7eb] border border-[#bccbb9]/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Account List */}
          <div className="col-span-12 lg:col-span-4 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
            {loading ? (
              <SkeletonLoader type="card" rows={4} />
            ) : accounts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-[#3d4a3d]">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold">No cases in this category</p>
                <p className="text-sm mt-1">Try a different filter</p>
              </div>
            ) : (
              accounts.map((acc) => (
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
                      <span className={getScoreColor(acc.fraudScore)}>{acc.fraudScore}%</span>
                    </div>
                    <div className="h-2 bg-[#e4f1e5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(acc.fraudScore)}`}
                        style={{ width: `${acc.fraudScore}%` }}
                      />
                    </div>
                  </div>
                  {/* Exposure */}
                  {acc.exposure > 0 && (
                    <p className="text-[10px] font-bold text-[#3d4a3d] mb-2">
                      Exposure: <span className="text-[#ba1a1a]">{formatCurrency(acc.exposure)}</span>
                    </p>
                  )}
                  {/* Signal Chips */}
                  <div className="flex flex-wrap gap-1">
                    {acc.signals.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] font-bold bg-[#ffdad6]/40 text-[#93000a] px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                    {acc.signals.length > 3 && (
                      <span className="text-[10px] font-bold text-[#3d4a3d] px-2 py-0.5">+{acc.signals.length - 3}</span>
                    )}
                  </div>
                  {/* Status badge */}
                  <div className="mt-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      acc.status === 'REVIEW' ? 'bg-blue-100 text-blue-700' :
                      acc.status === 'SUSPICIOUS' ? 'bg-yellow-100 text-yellow-700' :
                      acc.status === 'ESCALATED' ? 'bg-[#ffdad6] text-[#93000a]' :
                      'bg-[#eaf7eb] text-[#006e2d]'
                    }`}>{acc.status}</span>
                  </div>
                </div>
              ))
            )}
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Case {selected.id}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Exposure: {formatCurrency(selected.exposure)} · Fraud Score: {selected.fraudScore}%
                    </p>
                  </div>
                  {/* Decision Buttons */}
                  <div className="flex gap-2">
                    {DECISION_BUTTONS.map(({ label, status, color, hoverColor }) => (
                      <button
                        key={status}
                        onClick={() => handleDecision(status)}
                        disabled={!!deciding}
                        className={`${color} ${hoverColor} text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50`}
                      >
                        {deciding === status ? '...' : label}
                      </button>
                    ))}
                  </div>
                </div>

                {evidenceLoading ? (
                  <SkeletonLoader type="card" rows={3} />
                ) : evidence ? (
                  <>
                    {/* Risk Signal Breakdown - DYNAMIC */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
                      <h3 className="font-bold text-[#131e17] mb-5">Risk Signal Breakdown</h3>
                      <div className="space-y-4">
                        {evidence.signals.map(({ label, score, triggered }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="font-semibold flex items-center gap-2">
                                {label}
                                {triggered && (
                                  <span className="text-[9px] bg-[#ffdad6] text-[#ba1a1a] px-1.5 py-0.5 rounded-full font-black">TRIGGERED</span>
                                )}
                              </span>
                              <span className="font-black">{score}%</span>
                            </div>
                            <div className="h-2 bg-[#e4f1e5] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(score)}`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suspicious Money Flow Graph - DYNAMIC */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
                      <h3 className="font-bold text-[#131e17] mb-4">Suspicious Money Flow Network</h3>
                      <MoneyFlowGraph flowData={evidence.circularFlowData} />
                    </div>

                    {/* Net Worth Trend Chart - DYNAMIC */}
                    {evidence.netWorthTrend?.length > 0 && (
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
                        <h3 className="font-bold text-[#131e17] mb-4">Net Worth & Health Score Trend</h3>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evidence.netWorthTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e4f1e5" />
                              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                formatter={(value, name) => [
                                  name === 'netWorth' ? formatCurrency(value) : `${value}%`,
                                  name === 'netWorth' ? 'Net Worth' : 'Health Score'
                                ]}
                              />
                              <Line type="monotone" dataKey="netWorth" stroke="#006e2d" strokeWidth={2} name="Net Worth" dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="healthScore" stroke="#ba1a1a" strokeWidth={2} name="Health Score" dot={{ r: 3 }} strokeDasharray="5 3" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl p-12 text-center text-[#3d4a3d]">
                    <p className="text-sm">No evidence data available for this case.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-16 text-center text-[#3d4a3d]">
                <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Select a case to view evidence</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
