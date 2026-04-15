import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const MOCK_DATA = {
  name: 'Global Logistics Pvt Ltd',
  regNo: '20455/MH/2021',
  healthScore: 64,
  healthDelta: '+4.2%',
  supplierRisk: { stable: 45, watch: 30, critical: 25 },
  customerAging: [
    { label: '0-30', height: 25 },
    { label: '31-60', height: 75 },
    { label: '61-90', height: 100 },
    { label: '90+', height: 50 },
  ],
  workingCapital: [
    { month: 'JAN', inflow: 40, outflow: 30 },
    { month: 'FEB', inflow: 55, outflow: 45 },
    { month: 'MAR', inflow: 75, outflow: 60 },
    { month: 'APR', inflow: 65, outflow: 70 },
    { month: 'MAY', inflow: 90, outflow: 80 },
    { month: 'JUN', inflow: 85, outflow: 50 },
  ],
  flaggedInvoices: [
    { id: '#INV-88291', party: 'Reliance Infotech', due: 'Oct 12, 2023', amount: '₹4.2L', type: 'Payment Delay', critical: true },
    { id: '#INV-88244', party: 'Stellar Corp', due: 'Oct 15, 2023', amount: '₹1.8L', type: 'Partial Match', critical: false },
    { id: '#INV-88102', party: 'Matrix Solutions', due: 'Oct 08, 2023', amount: '₹12.5L', type: 'High Risk Client', critical: true },
  ],
  aiRecommendation: 'Factor ₹18.5L in invoices to improve working capital by 14%.',
};

export default function MSMEProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/customer/${id}/profile`)
      .then(({ data: res }) => { if (res) setData((prev) => ({ ...prev, ...res })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#f0fdf1] min-h-screen">
        <Sidebar />
        <main className="ml-64 p-8"><SkeletonLoader type="card" rows={4} /></main>
      </div>
    );
  }

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center w-full mb-10">
          <div>
            <h1 className="text-3xl font-extrabold">{data.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-[#1db954]/20 text-[#004118] px-3 py-1 rounded-full text-xs font-bold uppercase">MSME</span>
              <span className="text-[#3d4a3d] text-sm">Reg: {data.regNo}</span>
            </div>
          </div>
          <button onClick={() => navigate(`/customer/${id}`)} className="px-4 py-2 bg-[#d9e6da] text-[#131e17] text-sm font-bold rounded-xl">
            View 360° Profile
          </button>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* MSME Health Score */}
          <div className="col-span-12 lg:col-span-4 bg-[#eaf7eb] rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-[#3d4a3d] font-bold text-lg">MSME Health Score</h3>
                <span className="text-3xl">🛡️</span>
              </div>
              <div className="mt-8 flex items-baseline gap-4">
                <span className="text-8xl font-black text-[#006e2d] leading-none">{data.healthScore}</span>
                <div className="flex flex-col">
                  <div className="flex items-center text-[#006e2d] font-bold">
                    <span>↑</span>
                    <span>{data.healthDelta}</span>
                  </div>
                  <span className="text-[#3d4a3d] text-xs uppercase tracking-tighter font-semibold">vs last quarter</span>
                </div>
              </div>
              <p className="mt-6 text-[#3d4a3d]/80 text-sm leading-relaxed max-w-xs">
                Overall financial stability is <span className="font-bold text-[#131e17]">Moderate</span>. 
                Credit worthiness has improved due to timely supplier repayments.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity text-[200px]">🌿</div>
          </div>

          {/* Supply Chain Health */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-2xl font-bold">Supply Chain Health</h3>
                <p className="text-[#3d4a3d] text-sm">Real-time risk distribution across network</p>
              </div>
              <button
                onClick={() => navigate('/supply-chain')}
                className="text-[#006e2d] text-sm font-bold hover:underline"
              >
                Detailed View →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-12">
              {/* Supplier Risk */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#3d4a3d] text-xs font-bold uppercase tracking-widest">Supplier Risk</span>
                  <span className="text-[#ba1a1a] font-bold text-sm">High Exposure</span>
                </div>
                <div className="h-4 bg-[#e4f1e5] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#006e2d]" style={{ width: `${data.supplierRisk.stable}%` }} />
                  <div className="h-full bg-[#97a1b8]" style={{ width: `${data.supplierRisk.watch}%` }} />
                  <div className="h-full bg-[#ba1a1a]" style={{ width: `${data.supplierRisk.critical}%` }} />
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  {[
                    { color: 'bg-[#006e2d]', label: 'Stable (45%)' },
                    { color: 'bg-[#97a1b8]', label: 'Watch (30%)' },
                    { color: 'bg-[#ba1a1a]', label: 'Critical (25%)' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Aging */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#3d4a3d] text-xs font-bold uppercase tracking-widest">Customer Aging</span>
                  <span className="text-[#006e2d] font-bold text-sm">42 Days Avg</span>
                </div>
                <div className="flex items-end justify-between h-20 gap-2">
                  {data.customerAging.map(({ label, height }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-[#1db954]/60 rounded-t-lg" style={{ height: `${height}%`, minHeight: 4 }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-[#3d4a3d]/60 uppercase">
                  {data.customerAging.map(({ label }) => <span key={label}>{label}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Working Capital Analysis */}
          <div className="col-span-12 lg:col-span-7 bg-[#eaf7eb] rounded-xl p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold">Working Capital Analysis</h3>
                <p className="text-[#3d4a3d] text-sm">6-Month Capital Utilization Trend</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl flex gap-4">
                {[{ color: 'bg-[#006e2d]', label: 'Inflow' }, { color: 'bg-[#bccbb9]', label: 'Outflow' }].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-[10px] font-bold uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.workingCapital}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c5e8d5" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#3d4a3d' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="inflow" fill="#006e2d" radius={[4, 4, 0, 0]} name="Inflow" />
                  <Bar dataKey="outflow" fill="#bccbb9" radius={[4, 4, 0, 0]} name="Outflow" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flagged Invoices */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#ba1a1a] text-xl">⚠</span>
              <h3 className="text-xl font-bold">Flagged Invoices</h3>
            </div>
            <div className="space-y-4">
              {data.flaggedInvoices.map((inv) => (
                <div key={inv.id} className={`bg-[#e4f1e5] rounded-2xl p-4 flex justify-between items-center border-l-4 ${inv.critical ? 'border-[#ba1a1a]' : 'border-[#97a1b8]'}`}>
                  <div>
                    <div className="font-bold text-sm">{inv.id} - {inv.party}</div>
                    <div className="text-xs text-[#3d4a3d] mt-1">Due: {inv.due} • {inv.amount}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${inv.critical ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#97a1b8]/20 text-[#2e384b]'}`}>
                      {inv.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation */}
            <div className="mt-6 bg-[#72fe8f]/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#006e2d] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg font-bold">⚡</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#006e2d]">AI Recommendation</p>
                <p className="text-xs text-[#131e17] leading-tight mt-0.5">{data.aiRecommendation}</p>
              </div>
            </div>
          </div>

          {/* Intervention CTA Banner */}
          <div className="col-span-12">
            <div className="bg-[#28332b] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-[#e7f4e8] text-2xl font-bold">Need financial headroom?</h2>
                <p className="text-[#e7f4e8]/70 mt-2 max-w-xl">
                  Our intelligent restructuring tool analyzes your supply chain health and predicts the best intervention strategy.
                </p>
              </div>
              <button
                onClick={() => navigate(`/interventions?customerId=${id}`)}
                className="bg-gradient-to-br from-[#006e2d] to-[#1db954] text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-2xl hover:brightness-110 active:scale-95 transition-all relative z-10 flex items-center gap-3 flex-shrink-0"
              >
                Apply for Intervention →
              </button>
              <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-[#006e2d]/20 to-transparent" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
