import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Eye, ChevronRight, Scale, TrendingDown, 
  MapPin, Clock, ExternalLink, RefreshCw, User
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationPanel';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import React from 'react';

// Error Boundary to prevent white-screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-black bg-red-100 min-h-screen">
          <h1 className="text-2xl font-bold font-headline">Fraud Module Crash Detected</h1>
          <p className="mt-2">An error occurred while rendering the investigation panel. This is often due to malformed data.</p>
          <pre className="mt-4 p-4 bg-white/50 rounded overflow-auto text-xs">{this.state.error?.toString()}</pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#131e17] text-white rounded-lg text-sm font-bold"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

// Dynamic SVG money flow renderer for Fraud Investigation
function MoneyFlowGraph({ flowData }) {
  if (!flowData || flowData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No circular flow data detected for this audit.
      </div>
    );
  }

  const entities = new Set();
  flowData.forEach(f => { entities.add(f.from); entities.add(f.to); });
  const entityList = [...entities];

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
      {flowData.map((flow, i) => {
        const from = getPos(flow.from);
        const to = getPos(flow.to);
        return (
          <g key={i}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="#ba1a1a" strokeWidth="2" strokeDasharray="6 3"
              strokeOpacity="0.6"
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
      {positions.map((pos, i) => {
        const isSource = flowData.some(f => f.from === pos.name && !flowData.some(f2 => f2.to === pos.name));
        const isDest = flowData.some(f => f.to === pos.name && !flowData.some(f2 => f2.from === pos.name));
        const fill = isSource ? '#e4f1e5' : isDest ? '#ffdad6' : '#ffedd5';
        const stroke = isSource ? '#006e2d' : isDest ? '#ba1a1a' : '#f59e0b';
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="28" fill={fill} stroke={stroke} strokeWidth="2" className="drop-shadow-sm" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="7" fontWeight="black" fill={stroke}>
              {pos.name.length > 10 ? pos.name.slice(0, 10) + '…' : pos.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FraudReviewInternal() {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [deciding, setDeciding] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.get('/fraud/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const fetchCases = useCallback(async (statusFilter) => {
    setLoading(true);
    try {
      const url = statusFilter ? `/fraud?status=${statusFilter}` : '/fraud';
      const { data } = await api.get(url);
      if (data?.accounts) {
        const mapped = data.accounts.map(a => {
          let signalArray = [];
          if (a.indicatorsTriggered) {
             // Handle both Mongoose objects and plain objects defensively
            const triggers = (a.indicatorsTriggered.toObject ? a.indicatorsTriggered.toObject() : a.indicatorsTriggered);
            signalArray = Object.entries(triggers)
              .filter(([k, v]) => v && k !== '_id' && k !== '__v')
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
      addToast('Failed to load fraud cases.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, selected]);

  useEffect(() => {
    fetchCases(activeFilter);
  }, [activeFilter, fetchCases]);

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
      const txMsg = data.txId ? ` | Blockchain Secured` : '';
      addToast(`${selected.name} investigation ${label}${txMsg}`, 'success');
      setAccounts(prev => prev.filter(a => a.id !== selected.id));
      setSelected(accounts.find(a => a.id !== selected.id) || null);
      api.get('/fraud/stats').then(({ data }) => setStats(data)).catch(() => {});
    } catch {
      addToast('Decision failed. Check network connection.', 'error');
    } finally {
      setDeciding(null);
    }
  };

  const handleSync = async () => {
    if (!selected || syncing) return;
    setSyncing(true);
    try {
      const { data } = await api.post(`/fraud/${selected.id}/sync`);
      addToast(`ML Audit Complete: ${data.fraudScore}% score identified.`, 'success');
      setAccounts(prev => prev.map(a => a.id === selected.id ? { ...a, fraudScore: data.fraudScore } : a));
      setSelected(prev => ({ ...prev, fraudScore: data.fraudScore }));
      if (evidence) setEvidence(prev => ({ ...prev, fraudScore: data.fraudScore, blockchainTxId: data.txId }));
    } catch {
      addToast('ML Sync failed. Ensure ML service is reachable.', 'error');
    } finally {
      setSyncing(false);
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
    <div className="bg-[#f2fcf3] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#131e17] font-headline">Fraud Investigation Hub</h1>
            <p className="text-[#3d4a3d] mt-1 font-medium opacity-80">Advanced ML monitoring for distressed account anomalies</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="w-10 h-10 rounded-full bg-[#131e17] text-white flex items-center justify-center font-black shadow-lg">A</div>
          </div>
        </header>

        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Alerts', value: stats.total, icon: <ShieldAlert className="w-4 h-4" />, bg: 'bg-white' },
              { label: 'Active Review', value: stats.review, icon: <Eye className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50/30' },
              { label: 'Suspicious', value: stats.suspicious, icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, bg: 'bg-yellow-50/30' },
              { label: 'Critical High', value: stats.escalated, icon: <TrendingDown className="w-4 h-4 text-[#ba1a1a]" />, bg: 'bg-[#ffdad6]/40' },
              { label: 'Risk Average', value: `${stats.avgScore}%`, icon: <Scale className="w-4 h-4 text-[#006e2d]" />, bg: 'bg-[#eaf7eb]' },
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-5 border border-[#bccbb9]/20 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white rounded-lg shadow-xs">{kpi.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#3d4a3d]">{kpi.label}</span>
                </div>
                <p className="text-3xl font-black text-[#131e17]">{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-8 items-center">
          <span className="text-xs font-bold text-[#3d4a3d] mr-2">FILTERS:</span>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveFilter(tab.value); setSelected(null); }}
              className={`text-[11px] font-black px-5 py-2.5 rounded-full transition-all tracking-wide ${
                activeFilter === tab.value
                  ? 'bg-[#131e17] text-white shadow-md'
                  : 'bg-white text-[#3d4a3d] hover:bg-[#eaf7eb] border border-[#bccbb9]/30'
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-4 max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <SkeletonLoader type="list" rows={5} />
            ) : accounts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-[#bccbb9]/30">
                <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p className="font-bold text-[#131e17]">No investigations found</p>
                <p className="text-xs text-[#3d4a3d] mt-1">This category is currently clean.</p>
              </div>
            ) : (
              accounts?.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => setSelected(acc)}
                  className={`bg-white rounded-2xl p-5 cursor-pointer transition-all border-2 relative overflow-hidden ${selected?.id === acc.id ? 'border-[#ba1a1a]/60 shadow-xl' : 'border-transparent hover:border-[#bccbb9]/40 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-sm text-[#131e17]">{acc.name}</p>
                      <p className="text-[10px] text-[#3d4a3d] font-bold opacity-60 uppercase">{acc.id} · {acc.type}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#3d4a3d]" />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-black mb-1.5">
                      <span className="uppercase tracking-tighter text-[#3d4a3d]">Anomaly Confidence</span>
                      <span className={getScoreColor(acc.fraudScore)}>{acc.fraudScore}%</span>
                    </div>
                    <div className="h-1.5 bg-[#e4f1e5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(acc.fraudScore)}`}
                        style={{ width: `${acc.fraudScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {acc.signals?.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] font-black bg-[#ffdad6]/60 text-[#93000a] px-3 py-1 rounded-lg uppercase tracking-tighter">{s}</span>
                    ))}
                  </div>
                  <div className="absolute bottom-0 right-0 p-2 opacity-5">
                    <ShieldAlert className="w-12 h-12" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-6">
            {selected ? (
              <>
                <div className="bg-[#131e17] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                         selected.status === 'REVIEW' ? 'bg-blue-500 text-white' :
                         selected.status === 'CLEARED' ? 'bg-[#1db954] text-white' :
                         'bg-[#ba1a1a] text-white'
                       }`}>{selected.status}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Case Audit Log</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-3xl font-black text-white">{selected.name}</h2>
                        <p className="text-gray-400 text-sm mt-1 font-medium italic">
                          Estimated Financial Exposure: <span className="text-white font-bold">{formatCurrency(selected.exposure)}</span>
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSync}
                          disabled={syncing}
                          className="px-5 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl text-xs font-black transition-all border border-white/10 flex items-center gap-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                          {syncing ? 'SYNCING...' : 'REFRESH AUDIT'}
                        </button>
                        {DECISION_BUTTONS.map(({ label, status, color, hoverColor }) => (
                          <button
                            key={status}
                            onClick={() => handleDecision(status)}
                            disabled={!!deciding}
                            className={`${color} ${hoverColor} text-white text-xs font-black px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50`}
                          >
                            {deciding === status ? '...' : label.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1db954]/20 to-transparent rounded-full -mr-20 -mt-20 blur-3xl" />
                </div>

                {evidenceLoading ? (
                  <div className="space-y-6">
                    <SkeletonLoader type="chart" />
                    <SkeletonLoader type="card" rows={2} />
                  </div>
                ) : evidence ? (
                  <div className="grid grid-cols-2 gap-6 pb-12">
                     {/* Risk Signal Breakdown */}
                    <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl p-7 shadow-sm border border-[#bccbb9]/30">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-[#131e17] uppercase tracking-tight">Signal Analysis</h3>
                        <Scale className="w-5 h-5 text-gray-300" />
                      </div>
                      <div className="space-y-5">
                        {evidence.signals?.map(({ label, score, triggered }) => (
                          <div key={label}>
                            <div className="flex justify-between text-[11px] mb-2">
                              <span className="font-black flex items-center gap-2 text-[#3d4a3d]">
                                {label}
                                {triggered && (
                                  <span className="text-[8px] bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded-md font-black animate-pulse">CRITICAL</span>
                                )}
                              </span>
                              <span className="font-black text-[#131e17]">{score}%</span>
                            </div>
                            <div className="h-2 bg-[#eaf7eb] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ${getBarColor(score)}`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Money Flow */}
                    <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl p-7 shadow-sm border border-[#bccbb9]/30">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-[#131e17] uppercase tracking-tight">Circularity Pattern</h3>
                        <AlertTriangle className="w-5 h-5 text-[#ba1a1a] opacity-40" />
                      </div>
                      <MoneyFlowGraph flowData={evidence.circularFlowData} />
                    </div>

                    {/* Blockchain Evidence Card */}
                    {evidence.blockchainTxId && (
                      <div className="col-span-2 bg-[#131e17] rounded-3xl p-6 shadow-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#1db954]/20 rounded-2xl">
                            <ShieldCheck className="w-8 h-8 text-[#1db954]" />
                          </div>
                          <div>
                            <h4 className="text-white font-black text-lg">Blockchain Proof of Integrity</h4>
                            <p className="text-gray-400 text-xs font-medium">Immutable audit trail anchored on Algorand Testnet</p>
                            <p className="text-[#1db954] text-[10px] mt-1 font-mono">{evidence.blockchainTxId}</p>
                          </div>
                        </div>
                        <a 
                          href={`https://testnet.allo.info/tx/${evidence.blockchainTxId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black transition-all border border-white/10 flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          VERIFY ON-CHAIN
                        </a>
                      </div>
                    )}

                    {/* Trends */}
                    {evidence.netWorthTrend?.length > 0 && (
                      <div className="col-span-2 bg-white rounded-3xl p-7 shadow-sm border border-[#bccbb9]/30">
                        <h3 className="font-black text-[#131e17] uppercase tracking-tight mb-6">Divergence Monitoring</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evidence.netWorthTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e4f1e5" vertical={false} />
                              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                                labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                              />
                              <Line type="monotone" dataKey="netWorth" stroke="#006e2d" strokeWidth={4} dot={{ r: 6, fill: '#006e2d', strokeWidth: 0 }} name="Asset Valuation" />
                              <Line type="monotone" dataKey="healthScore" stroke="#ba1a1a" strokeWidth={4} dot={{ r: 6, fill: '#ba1a1a', strokeWidth: 0 }} name="Risk Index" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-16 text-center shadow-inner">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Audit Evidence for Current Selection</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/50 rounded-3xl p-32 text-center border-4 border-dashed border-[#bccbb9]/20">
                <ShieldAlert className="w-24 h-24 mx-auto mb-6 text-[#131e17] opacity-5" />
                <h3 className="text-2xl font-black text-[#131e17] opacity-20">PENDING INVESTIGATION</h3>
                <p className="text-[#3d4a3d] text-sm mt-2 font-bold opacity-30">Select an anomaly alert from the sidebar to begin analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FraudReview() {
  return (
    <ErrorBoundary>
      <FraudReviewInternal />
    </ErrorBoundary>
  );
}
