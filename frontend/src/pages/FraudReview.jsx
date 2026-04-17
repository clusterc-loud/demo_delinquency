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
import { useTranslation } from '../i18n/LanguageContext';
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

const getStatusTabs = (t) => [
  { label: t('fraud.tabs.all'), value: '' },
  { label: t('fraud.tabs.review'), value: 'REVIEW' },
  { label: t('fraud.tabs.suspicious'), value: 'SUSPICIOUS' },
  { label: t('fraud.tabs.escalated'), value: 'ESCALATED' },
  { label: t('fraud.tabs.cleared'), value: 'CLEARED' },
];

const getDecisionButtons = (t) => [
  { label: t('fraud.investigation.clear'), status: 'CLEARED', color: 'bg-[#1db954]', hoverColor: 'hover:bg-[#159a43]' },
  { label: t('fraud.investigation.suspicious'), status: 'SUSPICIOUS', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
  { label: t('fraud.investigation.escalate'), status: 'ESCALATED', color: 'bg-[#ba1a1a]', hoverColor: 'hover:bg-[#93000a]' },
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
  const { t } = useTranslation();
  const STATUS_TABS = getStatusTabs(t);
  const DECISION_BUTTONS = getDecisionButtons(t);

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
        const mapped = data.accounts.map(a => ({
          id: a.customerId || a._id,
          name: a.customerName || 'Unknown Entity',
          fraudScore: a.fraudScore || 0,
          exposure: a.exposure || 0,
          status: a.status,
          type: a.customerType || 'RETAIL'
        }));
        setAccounts(mapped);
        if (mapped.length > 0 && !selected) setSelected(mapped[0]);
      }
    } catch {
      addToast('Failed to fetch fraud cases', 'error');
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
      addToast(`${selected.name} investigation ${label}`, 'success');
      setAccounts(prev => prev.filter(a => a.id !== selected.id));
      setSelected(null);
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
    } catch {
      addToast('ML Sync failed.', 'error');
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
      <main className="ml-64 p-8 min-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#131e17]">{t('fraud.title')}</h1>
            <p className="text-[#3d4a3d] text-sm mt-1">{t('admin.dashboard.systemLoad')}: <span className="text-[#1db954] font-bold">Optimal</span></p>
          </div>
          <NotificationBell />
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#131e17] p-6 rounded-2xl shadow-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest">{t('fraud.stats.avgScore')}</p>
              <h2 className="text-3xl font-black text-white mt-1">{stats?.avgFraudScore || '68.4'}</h2>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <ShieldAlert className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#bccbb9]/20 flex items-center justify-between">
            <div>
              <p className="text-[#3d4a3d] text-xs font-bold uppercase tracking-widest">{t('fraud.stats.topSignal')}</p>
              <h2 className="text-xl font-black text-[#131e17] mt-1">{stats?.topSignal?.name || stats?.topSignal || 'Circular Mapping'}</h2>
            </div>
            <div className="bg-[#ba1a1a]/5 p-3 rounded-xl border border-[#ba1a1a]/10">
              <AlertTriangle className="w-6 h-6 text-[#ba1a1a]" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#bccbb9]/20 flex items-center justify-between">
            <div>
              <p className="text-[#3d4a3d] text-xs font-bold uppercase tracking-widest">{t('fraud.stats.reviewAccounts')}</p>
              <h2 className="text-3xl font-black text-[#131e17] mt-1">{stats?.reviewCount || '14'}</h2>
            </div>
            <div className="bg-[#1db954]/5 p-3 rounded-xl border border-[#1db954]/10">
              <ShieldCheck className="w-6 h-6 text-[#1db954]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Case List */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl shadow-sm border border-[#bccbb9]/20 overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 border-b border-[#bccbb9]/20 bg-emerald-50/30 flex gap-1 overflow-x-auto no-scrollbar">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeFilter === tab.value ? 'bg-[#1db954] text-white shadow-lg shadow-[#1db954]/20' : 'text-[#3d4a3d] hover:bg-[#1db954]/5'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b border-[#bccbb9]/20 z-10">
                  <tr className="text-[10px] font-black text-[#3d4a3d]/60 uppercase tracking-widest">
                    <th className="px-6 py-4">{t('fraud.table.account')}</th>
                    <th className="px-6 py-4">{t('fraud.table.score')}</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bccbb9]/10">
                  {accounts.map(acc => (
                    <tr key={acc.id} onClick={() => setSelected(acc)} className={`cursor-pointer transition-colors ${selected?.id === acc.id ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-[#131e17]">{acc.name}</p>
                        <p className="text-[10px] text-[#3d4a3d] font-bold uppercase">{acc.type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-black ${getScoreColor(acc.fraudScore)}`}>{acc.fraudScore}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#bccbb9]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail View */}
          <div className="col-span-12 lg:col-span-7">
            {selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-[#bccbb9]/20 overflow-hidden">
                  <div className="p-8 border-b border-[#bccbb9]/20 bg-emerald-50/20">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#1db954] flex items-center justify-center text-white shadow-lg shadow-[#1db954]/20">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#131e17]">{selected.name}</h3>
                          <p className="text-[#3d4a3d] text-xs font-bold uppercase tracking-widest">{selected.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-[#3d4a3d]/60 uppercase tracking-widest mb-1">{t('fraud.investigation.syncAudit')}</span>
                        <button 
                          onClick={handleSync}
                          disabled={syncing}
                          className="flex items-center gap-2 bg-[#131e17] text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                          {t('fraud.investigation.syncAudit')}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-[#bccbb9]/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-[#3d4a3d]/60" />
                          <span className="text-[10px] font-black text-[#3d4a3d]/60 uppercase tracking-widest">Location</span>
                        </div>
                        <p className="text-sm font-bold text-[#131e17]">Pune Cluster, MH</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-[#bccbb9]/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 text-[#3d4a3d]/60" />
                          <span className="text-[10px] font-black text-[#3d4a3d]/60 uppercase tracking-widest">{t('fraud.investigation.auditTimeline')}</span>
                        </div>
                        <p className="text-sm font-bold text-[#131e17]">{t('fraud.investigation.lastSynced', { time: '12m ago' })}</p>
                      </div>
                    </div>
                  </div>

                  {evidenceLoading ? (
                    <div className="p-8">
                      <SkeletonLoader type="card" rows={3} />
                    </div>
                  ) : evidence ? (
                    <div className="p-8 grid grid-cols-12 gap-6">
                      <div className="col-span-12">
                        <div className="bg-[#131e17] p-6 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                              <ExternalLink className="w-4 h-4"/> {t('fraud.investigation.moneyFlow')}
                            </h4>
                          </div>
                          <MoneyFlowGraph flowData={evidence.circularFlow} />
                        </div>
                      </div>

                      <div className="col-span-12">
                        <div className="bg-white p-6 rounded-2xl border border-[#bccbb9]/20">
                          <h4 className="text-xs font-black text-[#3d4a3d] uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-[#ba1a1a]"/> {t('fraud.investigation.netWorthTrend')}
                          </h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={evidence.behavioralTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bccbb9/30" />
                                <XAxis dataKey="time" hide />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#131e17', borderRadius: '12px', border: 'none', color: '#fff' }}
                                  itemStyle={{ color: '#1db954', fontSize: '10px' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#ba1a1a" strokeWidth={3} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12">
                        <div className="bg-[#ffdad6]/20 p-6 rounded-2xl border border-[#ba1a1a]/10">
                          <h4 className="text-xs font-black text-[#ba1a1a] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Scale className="w-4 h-4"/> {t('fraud.investigation.decision')}
                          </h4>
                          <div className="flex gap-3">
                            {DECISION_BUTTONS.map(btn => (
                              <button
                                key={btn.status}
                                onClick={() => handleDecision(btn.status)}
                                disabled={!!deciding}
                                className={`flex-1 ${btn.color} ${btn.hoverColor} text-white font-bold py-3 px-4 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
                              >
                                {deciding === btn.status ? '...' : btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-inner">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Audit Evidence for Current Selection</p>
                    </div>
                  )}
              </div>
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
