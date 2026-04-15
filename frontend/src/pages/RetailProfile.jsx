import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HealthScoreGauge from '../components/HealthScoreGauge';
import SkeletonLoader from '../components/SkeletonLoader';
import { ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

const MOCK_RETAIL = {
  name: 'Rajesh Malhotra',
  segment: 'Retail',
  customerId: 'VC-882910',
  location: 'Mumbai, MH',
  accountOfficer: 'Ananya S.',
  healthScore: 82,
  healthLabel: 'STRONG',
  healthDelta: '+4 points vs last month',
  financialInsights: [
    { icon: '💰', label: 'Savings Growth', value: '₹42.5L', meta: 'Surplus liquidity 18% above forecast', accent: 'Target: 112%', accentColor: 'text-[#006e2d]' },
    { icon: '📅', label: 'Upcoming Payments', value: '₹1.12L', meta: 'Next: Home Loan EMI on 05 Oct.', accent: '3 Pending', accentColor: 'text-[#ba1a1a]' },
    { icon: '💳', label: 'Credit Health Index', value: '792 / 900', meta: 'Utilization at 14% of limit.', accent: 'Excellent', accentColor: 'text-[#006e2d]' },
  ],
  recentTransactions: [
    { date: '24 Sep, 2023', name: 'Zydus Wellness Ltd.', desc: 'Equity Investment Transfer', category: 'Investment', amount: '- ₹4,50,000', risk: 'normal' },
    { date: '22 Sep, 2023', name: 'CryptoExchange Prime', desc: 'External Wallet Loading', category: 'Transfer', amount: '- ₹82,000', risk: 'high', tooltip: 'High volatility asset purchase. Risk flag triggered.' },
    { date: '18 Sep, 2023', name: 'Apex Realty Corp', desc: 'Rental Income Credit', category: 'Income', amount: '+ ₹1,20,000', risk: 'normal' },
    { date: '15 Sep, 2023', name: 'Amazon India', desc: 'E-commerce Purchase', category: 'Lifestyle', amount: '- ₹12,400', risk: 'normal' },
  ],
};

export default function RetailProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(MOCK_RETAIL);
  const [loading, setLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [tenure, setTenure] = useState(15);

  useEffect(() => {
    setLoading(true);
    api.get(`/customer/${id}/profile`)
      .then(({ data: res }) => { if (res) setData((prev) => ({ ...prev, ...res })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const dtImpact = Math.round((loanAmount / 5000000) * 6 + (tenure / 30) * 2);
  const projScore = Math.max(40, data.healthScore - dtImpact);

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
      <main className="ml-64 min-h-screen pb-12">
        {/* Sticky TopBar */}
        <header className="flex justify-between items-center w-full px-8 py-4 bg-[#f0fdf1]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-[#e4f1e5]">
          <div className="flex items-center gap-2">
            <span
              className="text-[#3d4a3d] text-sm font-medium cursor-pointer hover:text-[#006e2d]"
              onClick={() => navigate(-1)}
            >
              Customer Profile
            </span>
            <span className="text-[#bccbb9]">›</span>
            <span className="text-[#006e2d] font-semibold">{data.name}</span>
          </div>
        </header>

        <div className="px-8 py-8 space-y-8">
          {/* Profile Header */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Info Card */}
            <div className="col-span-12 lg:col-span-8 bg-[#eaf7eb] p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[#1db954] to-[#006e2d] flex items-center justify-center text-4xl font-black text-white flex-shrink-0 shadow-lg">
                {data.name[0]}
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h2 className="text-4xl font-extrabold text-[#131e17]">{data.name}</h2>
                  <span className="inline-flex items-center px-3 py-1 bg-[#1db954] text-[#004118] text-xs font-bold rounded-full uppercase tracking-widest">Retail</span>
                </div>
                <p className="text-[#3d4a3d] max-w-lg leading-relaxed text-sm">
                  Preferred Tier client since 2018. Portfolio focused on real estate investment and diversified equity mutual funds. Low volatility profile.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
                  {[
                    { label: 'Customer ID', val: data.customerId },
                    { label: 'Location', val: data.location },
                    { label: 'Account Officer', val: data.accountOfficer },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white px-4 py-2 rounded-xl shadow-sm">
                      <p className="text-[10px] text-[#6d7b6c] uppercase font-bold tracking-tight">{label}</p>
                      <p className="text-sm font-bold">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Health Gauge */}
            <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-xl shadow-sm border border-[#bccbb9]/10 flex flex-col items-center justify-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#eaf7eb]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-sm font-bold mb-6 relative z-10">Financial Health Score</p>
              <div className="relative z-10">
                <HealthScoreGauge score={data.healthScore} size={192} label={data.healthLabel} />
              </div>
              <div className="mt-6 flex items-center gap-2 bg-[#72fe8f]/20 px-3 py-1 rounded-full relative z-10">
                <span className="text-[#006e2d] font-black text-lg">↑</span>
                <span className="text-xs font-bold text-[#005320]">{data.healthDelta}</span>
              </div>
            </div>
          </div>

          {/* Financial Insights Bento Grid */}
          <div>
            <h3 className="text-lg font-bold px-1 mb-4">Personal Financial Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.financialInsights.map((insight) => (
                <div key={insight.label} className="bg-[#eaf7eb] p-6 rounded-xl space-y-4 hover:-translate-y-1 transition-transform cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">
                      {insight.icon}
                    </div>
                    <span className={`text-xs font-bold ${insight.accentColor}`}>{insight.accent}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#3d4a3d]">{insight.label}</p>
                    <p className="text-2xl font-extrabold text-[#131e17]">{insight.value}</p>
                  </div>
                  <div className="w-full bg-[#d9e6da] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#006e2d] h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                  <p className="text-[10px] text-[#3d4a3d]">{insight.meta}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulator + Transactions */}
          <div className="grid grid-cols-12 gap-8 items-stretch">
            {/* Loan Impact Simulator */}
            <div className="col-span-12 lg:col-span-5 bg-[#d9e6da] p-8 rounded-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold">Loan Impact Simulator</h3>
                <p className="text-xs text-[#3d4a3d]">Model the effect of a new credit facility on this profile.</p>
              </div>
              <div className="space-y-6 py-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold">Additional Loan Principal</label>
                    <span className="text-[#006e2d] font-black">₹{(loanAmount / 100000).toFixed(0)}L</span>
                  </div>
                  <input type="range" min="0" max="10000000" step="100000" value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-2 bg-[#c5e8d5] rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold">Repayment Tenure</label>
                    <span className="text-[#006e2d] font-black">{tenure} Years</span>
                  </div>
                  <input type="range" min="1" max="30" value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-full h-2 bg-[#c5e8d5] rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
              <div className="p-4 bg-[#72fe8f]/20 border-l-4 border-[#006e2d] rounded-r-xl">
                <div className="flex gap-3">
                  <span className="text-xl text-[#006e2d]">⚡</span>
                  <div>
                    <p className="text-xs font-bold text-[#005320]">AI Intervention</p>
                    <p className="text-[11px] text-[#3d4a3d] leading-relaxed mt-0.5">
                      This loan will change Health Score to <span className="font-bold">{projScore}</span>. DTI ratio will remain {projScore > 70 ? 'within safe' : 'above safe'} threshold.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#bccbb9]/10">
              <div className="px-8 py-6 flex justify-between items-center bg-[#eaf7eb]/50">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <button className="text-xs font-bold text-[#006e2d] flex items-center gap-1 hover:underline">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] text-[#6d7b6c] uppercase tracking-widest border-b border-[#e4f1e5]">
                      <th className="px-8 py-4 font-black">Date</th>
                      <th className="px-4 py-4 font-black">Transaction</th>
                      <th className="px-4 py-4 font-black">Category</th>
                      <th className="px-4 py-4 font-black text-right">Amount</th>
                      <th className="px-8 py-4 font-black text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.recentTransactions.map((tx, i) => (
                      <tr key={i} className={`hover:bg-[#eaf7eb]/50 transition-colors ${i % 2 === 1 ? 'bg-[#eaf7eb]/20' : ''}`}>
                        <td className="px-8 py-4 text-xs text-[#3d4a3d] font-medium">{tx.date}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold">{tx.name}</p>
                          <p className="text-[10px] text-[#6d7b6c]">{tx.desc}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-[#d9e6da] rounded text-[10px] font-bold">{tx.category}</span>
                        </td>
                        <td className={`px-4 py-4 text-right font-bold ${tx.amount.includes('+') ? 'text-[#006e2d]' : tx.risk === 'high' ? 'text-[#ba1a1a]' : ''}`}>
                          {tx.amount}
                        </td>
                        <td className="px-8 py-4 text-center">
                          {tx.risk === 'high' ? (
                            <div className="relative group inline-block">
                              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] cursor-help" />
                              {tx.tooltip && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-[#28332b] text-[#e7f4e8] text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                  {tx.tooltip}
                                </div>
                              )}
                            </div>
                          ) : (
                            <CheckCircle className="w-5 h-5 text-[#006e2d] mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
