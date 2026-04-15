import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Sidebar from '../components/Sidebar';
import KPICard from '../components/KPICard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Search, Bell, AlertTriangle, Megaphone, TrendingDown } from 'lucide-react';
import api from '../api/axios';

const HEATMAP_ROWS = ['Agri-Loans', 'MSME Credit', 'Retail Per', 'Commercial'];
const HEATMAP_COLS = ['Region N', 'Region E', 'Region W', 'Region S', 'Central', 'Global'];

const STATIC_HEATMAP = [
  ['#131e17', '#006e2d33', '#131e17', '#131e17', '#006e2d66', '#131e17'],
  ['#006e2d66', '#ba1a1acc', '#1db954', '#006e2d33', '#131e17', '#006e2d66'],
  ['#131e17', '#131e17', '#006e2d33', '#131e17', '#006e2d33', '#131e17'],
  ['#1db954', '#006e2d66', '#131e17', '#ba1a1a99', '#131e17', '#006e2d33'],
];

const AREA_DATA = [
  { name: '0', value: 15, current: 20 },
  { name: '25', value: 45, current: 55 },
  { name: '50', value: 80, current: 70 },
  { name: '75', value: 40, current: 50 },
  { name: '100', value: 20, current: 15 },
];

const BAR_DATA = [
  { month: 'Oct', outcomes: 72 },
  { month: 'Nov', outcomes: 85 },
  { month: 'Dec', outcomes: 68 },
  { month: 'Jan', outcomes: 91 },
  { month: 'Feb', outcomes: 78 },
  { month: 'Mar', outcomes: 88 },
];

const AI_ACTIONS = [
  { icon: <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />, bg: 'bg-[#ffdad6]/30', title: 'Freeze accounts in Sector 7-B', desc: 'Anomalous MSME withdrawal pattern detected.' },
  { icon: <Megaphone className="w-5 h-5 text-[#006e2d]" />, bg: 'bg-[#72fe8f]/30', title: 'Initiate Soft Recovery for Cluster E', desc: '85% probability of successful payment within 48h.' },
  { icon: <TrendingDown className="w-5 h-5 text-[#466656]" />, bg: 'bg-[#c5e8d5]/30', title: 'Adjust Liquidity Buffers', desc: 'Expected uptick in small-ticket defaults in Q3.' },
];

const DEFAULT_KPIS = [
  { label: 'Accounts Flagged Today', value: 1284, delta: '+12.5%', deltaType: 'negative', sparklineData: [40, 55, 45, 70, 60, 90] },
  { label: 'P1 Critical Cases', value: 42, delta: '-4%', deltaType: 'positive', sparklineData: [80, 75, 60, 50, 45, 35] },
  { label: 'Interventions Sent', value: 912, delta: 'Optimal', deltaType: 'positive', sparklineData: [30, 45, 40, 65, 75, 85] },
  { label: 'Recovery Rate', value: '88.4%', delta: '+2.1%', deltaType: 'positive', highlighted: true },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [areaData, setAreaData] = useState(AREA_DATA);
  const [barData, setBarData] = useState(BAR_DATA);
  const [loading, setLoading] = useState(false);
  const [recentFlags, setRecentFlags] = useState([]);
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes] = await Promise.all([
        api.get('/dashboard/kpis').catch(() => ({ data: null })),
      ]);
      if (kpiRes.data) {
        const d = kpiRes.data;
        setKpis([
          { label: 'Accounts Flagged Today', value: d.totalFlagged, delta: d.deltas?.totalFlagged, deltaType: 'negative', sparklineData: [40, 55, 45, 70, 60, 90] },
          { label: 'P1 Critical Cases', value: d.p1Critical, delta: d.deltas?.p1Critical, deltaType: 'positive', sparklineData: [80, 75, 60, 50, 45, 35] },
          { label: 'Interventions Pending', value: d.interventionsPending, delta: d.deltas?.interventionsPending, deltaType: 'positive', sparklineData: [30, 45, 40, 65, 75, 85] },
          { label: 'Recovery Rate 30d', value: `${d.recoveryRate30d}%`, delta: d.deltas?.recoveryRate30d, deltaType: 'positive', highlighted: true },
        ]);
      }
    } catch (_) {
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen selection:bg-[#1db954] selection:text-[#004118]">
      <Sidebar />

      <main className="ml-64 p-8 min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#131e17]">Portfolio Intelligence</h1>
            <p className="text-[#3d4a3d] font-medium mt-1">
              Market conditions: <span className="text-[#1db954]">Stable Ecosystem</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#dfece0] px-4 py-2 rounded-full gap-3">
              <Search className="w-5 h-5 text-[#3d4a3d]" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-48 p-0 outline-none"
                placeholder="Search accounts..."
                type="text"
              />
            </div>
            <button className="w-10 h-10 rounded-full bg-[#d9e6da] flex items-center justify-center text-[#3d4a3d] hover:bg-[#1db954] hover:text-white transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-[#d9e6da] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-[#131e17] font-bold">
              A
            </div>
          </div>
        </header>

        {/* KPI Grid */}
        {loading ? (
          <SkeletonLoader type="card" rows={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, i) => (
              <KPICard key={i} {...kpi} />
            ))}
          </div>
        )}

        {/* Main Bento Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Risk Heatmap */}
          <div className="col-span-12 lg:col-span-8 bg-[#eaf7eb] p-8 rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#131e17]">Risk Heatmap: Regional Exposure</h3>
                <p className="text-sm text-[#3d4a3d]">Risk intensity by product and geographical cluster</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span>Low Risk</span>
                <div className="flex h-3 w-32 rounded-sm overflow-hidden">
                  <div className="bg-[#131e17] h-full w-1/4" />
                  <div className="bg-[#006e2d]/40 h-full w-1/4" />
                  <div className="bg-[#1db954] h-full w-1/4" />
                  <div className="bg-[#ba1a1a] h-full w-1/4" />
                </div>
                <span>Critical</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid gap-2 min-w-[600px]" style={{ gridTemplateColumns: '100px repeat(6, 1fr)' }}>
                {/* Column headers */}
                <div />
                {HEATMAP_COLS.map((c) => (
                  <div key={c} className="text-center text-[10px] font-bold uppercase tracking-widest text-[#3d4a3d]">{c}</div>
                ))}
                {/* Rows */}
                {HEATMAP_ROWS.map((row, ri) => (
                  <>
                    <div key={`label-${ri}`} className="text-right text-[10px] font-bold uppercase tracking-widest text-[#3d4a3d] py-4 pr-2 flex items-center justify-end">
                      {row}
                    </div>
                    {STATIC_HEATMAP[ri].map((color, ci) => (
                      <div
                        key={`cell-${ri}-${ci}`}
                        className="rounded-lg h-12 transition-all hover:opacity-80 cursor-pointer"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </>
                ))}
              </div>
            </div>
          </div>

          {/* Segment Breakdown */}
          <div className="col-span-12 lg:col-span-4 bg-[#d9e6da] p-8 rounded-xl flex flex-col">
            <h3 className="text-xl font-bold text-[#131e17] mb-2">Segment Breakdown</h3>
            <p className="text-sm text-[#3d4a3d] mb-8">Asset distribution by portfolio type</p>
            <div className="flex-1 flex flex-col justify-center items-center relative">
              {/* Donut mockup */}
              <div className="w-48 h-48 rounded-full border-[20px] border-[#1db954] flex items-center justify-center relative">
                <div className="absolute inset-[-20px] rounded-full border-[20px] border-[#3d4a3d]/20 border-l-transparent border-t-transparent -rotate-45" />
                <div className="text-center">
                  <span className="text-3xl font-black text-[#131e17]">64%</span>
                  <p className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-tighter">MSME Leads</p>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {[
                { color: 'bg-[#1db954]', label: 'MSME Credits', value: '₹4.2 Cr' },
                { color: 'bg-[#3d4a3d]/30', label: 'Retail Loans', value: '₹2.1 Cr' },
              ].map(({ color, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Score Distribution */}
          <div className="col-span-12 bg-[#eaf7eb] p-8 rounded-xl">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h3 className="text-xl font-bold text-[#131e17]">Risk Score Distribution</h3>
                <p className="text-sm text-[#3d4a3d]">Population density across credit score tiers (0-100)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-[#006e2d] rounded-sm" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#3d4a3d]">Last Week</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-[#1db954]/40 rounded-sm" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#3d4a3d]">Current</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1db954" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1db954" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#bccbb9" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#3d4a3d' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="value" stroke="#006e2d" strokeWidth={3} fill="url(#colorValue)" name="Last Week" />
                  <Area type="monotone" dataKey="current" stroke="#1db954" strokeWidth={2} fill="none" strokeDasharray="5 3" name="Current" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-black text-[#3d4a3d]/60 uppercase tracking-[0.2em]">
              <span>0 (Safe)</span><span>25</span><span>50</span><span>75</span><span>100 (Default)</span>
            </div>
          </div>

          {/* AI Intervention Chips */}
          <div className="col-span-12 bg-white/40 backdrop-blur-md p-6 rounded-xl border border-[#1db954]/20">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-[#72fe8f] text-[#002108] px-3 py-1 rounded-full text-xs font-bold uppercase">AI Recommended Actions</span>
              <span className="text-xs text-[#3d4a3d] italic">Insights generated 4 minutes ago</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {AI_ACTIONS.map((action, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 flex-1 min-w-[280px] border border-[#bccbb9]/10">
                  <div className={`p-2 ${action.bg} rounded-lg`}>{action.icon}</div>
                  <div>
                    <p className="text-sm font-bold">{action.title}</p>
                    <p className="text-[10px] text-[#3d4a3d] font-medium">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Outcomes Bar Chart */}
          <div className="col-span-12 bg-[#eaf7eb] p-8 rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#131e17]">Intervention Outcomes</h3>
                <p className="text-sm text-[#3d4a3d]">Monthly success rate (%)</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#bccbb9" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#3d4a3d' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#3d4a3d' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="outcomes" fill="#1db954" radius={[6, 6, 0, 0]} name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="ml-64 py-12 px-8 flex flex-col items-center justify-center gap-4 bg-[#eaf7eb] text-[#131e17]/60">
        <div className="flex gap-8">
          {['Privacy Policy', 'Terms of Service', 'Regulatory Disclosures'].map((l) => (
            <a key={l} href="#" className="text-xs font-medium hover:text-[#1db954] transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs font-medium">© 2024 VittChetak FinTech. Secured by Tonal Trust.</p>
      </footer>
    </div>
  );
}
