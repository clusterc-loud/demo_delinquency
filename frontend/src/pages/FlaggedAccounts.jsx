import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import RiskBadge from '../components/RiskBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../api/axios';

const MOCK_ACCOUNTS = [
  {
    id: 'VC-18842',
    name: 'Global Logistics Pvt Ltd',
    segment: 'MSME',
    healthScore: 38,
    pattern: 'Cash Flow Squeeze',
    fraudScore: 82,
    priority: 'P1',
    status: 'Pending',
    shap: [
      { feature: 'Days Past Due (30+)', importance: 0.85, direction: 'up' },
      { feature: 'GST Filing Gap', importance: 0.72, direction: 'up' },
      { feature: 'Supplier Payment Delay', importance: 0.60, direction: 'up' },
    ],
    recommendation: 'Initiate liquidity restructuring. Offer Moratorium Period of 90 days.',
  },
  {
    id: 'VC-82910',
    name: 'Rajesh Malhotra',
    segment: 'Retail',
    healthScore: 44,
    pattern: 'Income Shock',
    fraudScore: 30,
    priority: 'P2',
    status: 'Active',
    shap: [
      { feature: 'Salary Reduction Signal', importance: 0.75, direction: 'up' },
      { feature: 'EMI-to-Income Ratio', importance: 0.60, direction: 'up' },
      { feature: 'Digital Spend Drop', importance: 0.45, direction: 'up' },
    ],
    recommendation: 'Send proactive re-engagement via SMS & call. EMI holiday advisable.',
  },
  {
    id: 'VC-33180',
    name: 'Celestial Ventures Ltd',
    segment: 'MSME',
    healthScore: 55,
    pattern: 'Supply Chain Risk',
    fraudScore: 20,
    priority: 'P2',
    status: 'Active',
    shap: [
      { feature: 'Buyer Distress Index', importance: 0.68, direction: 'up' },
      { feature: 'Receivables Aging', importance: 0.55, direction: 'up' },
    ],
    recommendation: 'Monitor weekly. Alert RM if buyer fails GST for 2 consecutive months.',
  },
  {
    id: 'VC-92201',
    name: 'Suresh Textile Exports',
    segment: 'MSME',
    healthScore: 71,
    pattern: 'Seasonal Variance',
    fraudScore: 12,
    priority: 'P3',
    status: 'Resolved',
    shap: [
      { feature: 'Seasonality Factor', importance: 0.50, direction: 'neutral' },
    ],
    recommendation: 'Historical seasonal pattern confirmed. No intervention required.',
  },
];

function FraudBar({ score }) {
  const color = score >= 70 ? 'bg-[#ba1a1a]' : score >= 40 ? 'bg-yellow-400' : 'bg-[#1db954]';
  return (
    <div className="flex items-center gap-2 w-24">
      <div className="h-1.5 rounded-full bg-[#d9e6da] flex-1 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-bold" style={{ color: score >= 70 ? '#ba1a1a' : score >= 40 ? '#b45309' : '#006e2d' }}>
        {score}%
      </span>
    </div>
  );
}

export default function FlaggedAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('All');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/flagged?search=${search}&priority=${priority === 'All' ? '' : priority}`);
        if (res.data?.accounts) setAccounts(res.data.accounts);
      } catch (_) {
        // Keep mock data
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [search, priority]);

  const filtered = accounts.filter((a) => {
    const safeName = a.name || 'Unknown';
    const matchSearch = search === '' || safeName.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search);
    const matchPriority = priority === 'All' || a.priority === priority;
    return matchSearch && matchPriority;
  });

  const toggleRow = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#131e17]">Flagged Accounts</h1>
            <p className="text-[#3d4a3d] font-medium mt-1">
              {filtered.length} accounts under active risk surveillance
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d4a3d]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#dfece0] border-none rounded-full pl-10 pr-4 py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-[#006e2d]/20"
              placeholder="Search by name or ID..."
            />
          </div>
          {/* Priority Pills */}
          <div className="flex gap-2">
            {['All', 'P1', 'P2', 'P3'].map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  priority === p
                    ? 'bg-[#006e2d] text-white shadow-sm'
                    : 'bg-white border border-[#bccbb9]/30 text-[#3d4a3d] hover:bg-[#dfece0]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonLoader type="table" rows={4} />
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#bccbb9]/10">
            {/* Table Header */}
            <div className="grid items-center px-6 py-4 bg-[#eaf7eb] text-[10px] font-black uppercase tracking-widest text-[#3d4a3d]"
              style={{ gridTemplateColumns: '1fr 1fr 80px 1fr 1fr 1fr 80px 40px' }}
            >
              <span>Customer</span>
              <span>Segment</span>
              <span>Health</span>
              <span>Pattern</span>
              <span>Fraud Score</span>
              <span>Priority</span>
              <span>Status</span>
              <span />
            </div>

            {filtered.length === 0 && (
              <div className="py-16 text-center text-[#3d4a3d]">No accounts match your filters.</div>
            )}

            {filtered.map((acc) => (
              <div key={acc.id}>
                {/* Main row */}
                <div
                  className="grid items-center px-6 py-5 border-b border-[#e4f1e5] hover:bg-[#eaf7eb]/50 transition-colors cursor-pointer group"
                  style={{ gridTemplateColumns: '1fr 1fr 80px 1fr 1fr 1fr 80px 40px' }}
                  onClick={() => toggleRow(acc.id)}
                >
                  <div>
                    <p className="font-bold text-sm">{acc.name}</p>
                    <p className="text-[10px] text-[#3d4a3d] font-medium mt-0.5">{acc.id}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full w-fit ${acc.segment === 'MSME' ? 'bg-[#1db954]/20 text-[#004118]' : 'bg-[#d9e3fb] text-[#2e384b]'}`}>
                    {acc.segment}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-black ${acc.healthScore < 40 ? 'text-[#ba1a1a]' : acc.healthScore < 60 ? 'text-yellow-600' : 'text-[#006e2d]'}`}>
                      {acc.healthScore}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#131e17]">{acc.pattern}</span>
                  <FraudBar score={acc.fraudScore} />
                  <RiskBadge priority={acc.priority} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${acc.status === 'Resolved' ? 'bg-[#72fe8f]/30 text-[#006e2d]' : acc.status === 'Active' ? 'bg-[#d9e3fb] text-[#2e384b]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                    {acc.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/customer/${acc.id}`); }}
                      className="p-1 text-[#3d4a3d] hover:text-[#006e2d] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <ChevronDown
                      className={`w-5 h-5 text-[#3d4a3d] transition-transform ${expanded === acc.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Row */}
                {expanded === acc.id && (
                  <div className="bg-[#eaf7eb]/60 px-8 py-6 border-b border-[#e4f1e5] grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    {/* SHAP Signals */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-widest text-[#3d4a3d] mb-4">SHAP Feature Signals</h4>
                      <div className="space-y-3">
                        {acc.shap.map((s) => (
                          <div key={s.feature}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium">{s.feature}</span>
                              <span className="font-bold text-[#ba1a1a]">+{(s.importance * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-[#d9e6da] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#ba1a1a]/60"
                                style={{ width: `${s.importance * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* AI Recommendation */}
                    <div className="md:col-span-2">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-[#3d4a3d] mb-4">AI Recommendation</h4>
                      <div className="bg-[#72fe8f]/20 border border-[#1db954]/20 rounded-xl p-4">
                        <p className="text-sm font-medium text-[#131e17] leading-relaxed">{acc.recommendation}</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => navigate(`/interventions?customerId=${acc.id}`)}
                          className="px-4 py-2 bg-[#006e2d] text-white text-sm font-bold rounded-xl hover:bg-[#004118] transition-colors"
                        >
                          Send Intervention
                        </button>
                        <button
                          onClick={() => navigate(`/customer/${acc.id}`)}
                          className="px-4 py-2 bg-[#d9e6da] text-[#131e17] text-sm font-bold rounded-xl hover:bg-[#c5e8d5] transition-colors"
                        >
                          Full 360° Profile
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
