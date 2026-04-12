import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Bell, Settings, Activity, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import HealthScoreGauge from '../components/HealthScoreGauge';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const MOCK_HEALTH = {
  customerId: 'VC-00012',
  name: 'Kavya Nair',
  healthScore: 74,
  scoreLabel: 'STRONG',
  positives: [
    { label: 'Consistent Savings Habit', icon: '✅' },
    { label: 'Strong EMI Track Record', icon: '✅' },
  ],
  watchItems: [
    { label: 'Rising Digital Spend', icon: '⚠️' },
    { label: 'Slight DTI Increase', icon: '⚠️' },
  ],
  aiTip: 'Reduce non-essential spending by 15% to improve your score by 7 points in 60 days.',
  scenario: {
    projectedScore: 74,
    debtChange: 0,
    projectionData: [74, 73, 72, 71, 70],
  },
  alertPreferences: {
    missedPayment: true,
    scoreChange: true,
    marketUpdate: false,
  },
};

export default function CustomerPortal() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [data, setData] = useState(MOCK_HEALTH);
  const [loading, setLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [tenure, setTenure] = useState(5);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [alertPrefs, setAlertPrefs] = useState(MOCK_HEALTH.alertPreferences);
  const [counsellorLoading, setCounsellorLoading] = useState(false);
  const simTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/portal/${id}/health`)
      .then(({ data: res }) => { if (res) setData((p) => ({ ...p, ...res })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const runSimulation = () => {
    if (simTimer.current) clearTimeout(simTimer.current);
    setSimLoading(true);
    simTimer.current = setTimeout(async () => {
      try {
        const { data: res } = await api.post(`/portal/${id}/simulate`, { loanAmount, tenure });
        setSimResult(res);
      } catch {
        const impact = Math.round(loanAmount / 1000000 * 5 + tenure * 0.5);
        setSimResult({ projectedScore: Math.max(20, data.healthScore - impact), change: -impact });
      } finally {
        setSimLoading(false);
      }
    }, 600);
  };

  useEffect(() => { runSimulation(); }, [loanAmount, tenure]);

  const toggleAlert = async (key) => {
    const updated = { ...alertPrefs, [key]: !alertPrefs[key] };
    setAlertPrefs(updated);
    api.patch(`/portal/${id}/alert-preferences`, { preferences: updated }).catch(() => {});
  };

  const handleCounsellor = async () => {
    setCounsellorLoading(true);
    try {
      await api.post(`/portal/${id}/request-counsellor`);
      addToast('Counsellor request submitted! We\'ll contact you within 24 hours.', 'success');
    } catch {
      addToast('Request submitted (demo mode).', 'warning');
    } finally {
      setCounsellorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f0fdf1] min-h-screen p-8">
        <SkeletonLoader type="card" rows={4} />
      </div>
    );
  }

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      {/* Customer Portal TopBar */}
      <nav className="bg-[#131e17] flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          <Activity className="w-6 h-6 text-[#1db954]" />
          VittChetak
          <span className="text-[10px] font-medium text-gray-400 ml-2 border-l border-gray-600 pl-2">My Portal</span>
        </div>
        <div className="flex gap-3">
          <button className="p-2 text-gray-300 hover:bg-[#1db954]/10 rounded-full transition-all"><Bell className="w-5 h-5" /></button>
          <button className="p-2 text-gray-300 hover:bg-[#1db954]/10 rounded-full transition-all"><Settings className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="px-6 lg:px-24 py-12 max-w-7xl mx-auto space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold">Welcome back, {data.name?.split(' ')[0]} 👋</h1>
            <p className="text-[#3d4a3d] mt-1">Here's your personalized financial health overview</p>
          </div>
          <button
            onClick={handleCounsellor}
            disabled={counsellorLoading}
            className="flex items-center gap-2 bg-[#ba1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#93000a] active:scale-95 transition-all animate-pulse-red"
            style={{ animation: 'pulse-red 2s infinite' }}
          >
            {counsellorLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            I Need Help
          </button>
        </div>

        {/* Health Score + Signals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gauge Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10 flex flex-col items-center">
            <p className="text-sm font-bold mb-4">Financial Health Score</p>
            <HealthScoreGauge score={data.healthScore} size={176} label={data.scoreLabel} />
            <div className="mt-4 flex items-center gap-2 bg-[#72fe8f]/20 px-3 py-1 rounded-full">
              <span className="text-[#006e2d] text-lg">↑</span>
              <span className="text-xs font-bold text-[#005320]">+4 points this month</span>
            </div>
          </div>

          {/* Positives */}
          <div className="bg-[#eaf7eb] rounded-xl p-6">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-[#3d4a3d]">What's Going Well ✨</h3>
            <div className="space-y-3">
              {data.positives.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Watch Items */}
          <div className="bg-[#ffdad6]/30 rounded-xl p-6">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-[#3d4a3d]">Areas to Watch 👀</h3>
            <div className="space-y-3">
              {data.watchItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Tip Card */}
        <div className="bg-gradient-to-r from-[#006e2d] to-[#1db954] rounded-xl p-6 flex items-center gap-6">
          <div className="text-4xl">💡</div>
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Personalized AI Tip</p>
            <p className="text-white font-semibold leading-relaxed">{data.aiTip}</p>
          </div>
        </div>

        {/* What-If Simulator + Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simulator */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
            <h3 className="text-lg font-bold mb-1">What-If Scenario Simulator</h3>
            <p className="text-xs text-[#3d4a3d] mb-6">Model the effect of a new loan on your health score</p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold">Additional Loan</label>
                  <span className="text-[#006e2d] font-black">₹{(loanAmount / 100000).toFixed(0)}L</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000000"
                  step="100000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-[#e4f1e5] rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold">Tenure</label>
                  <span className="text-[#006e2d] font-black">{tenure} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full h-2 bg-[#e4f1e5] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {simLoading ? (
              <div className="mt-4 h-14 shimmer rounded-xl" />
            ) : simResult ? (
              <div className={`mt-6 p-4 rounded-xl border-l-4 ${simResult.change < -10 ? 'bg-[#ffdad6]/30 border-[#ba1a1a]' : 'bg-[#72fe8f]/20 border-[#006e2d]'}`}>
                <p className="text-xs font-bold text-[#3d4a3d]">AI Analysis</p>
                <p className="text-sm text-[#131e17] leading-relaxed mt-1">
                  This loan will set your Health Score to{' '}
                  <span className={`font-black ${simResult.projectedScore < 60 ? 'text-[#ba1a1a]' : 'text-[#006e2d]'}`}>
                    {simResult.projectedScore}
                  </span>
                  {simResult.change < 0 ? ` (${simResult.change} pts impact)` : ''}.
                </p>
              </div>
            ) : null}
          </div>

          {/* Alert Preferences */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
            <h3 className="text-lg font-bold mb-6">Alert & Vigilance Settings</h3>
            <div className="space-y-4">
              {[
                { key: 'missedPayment', label: 'Missed Payment Warnings', desc: '3 days before using' },
                { key: 'scoreChange', label: 'Health Score Changes', desc: 'Alert on ±5 points' },
                { key: 'marketUpdate', label: 'Market Updates', desc: 'Weekly financial news' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-[#e4f1e5] last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-[#3d4a3d]">{desc}</p>
                  </div>
                  <button onClick={() => toggleAlert(key)} className="flex-shrink-0">
                    {alertPrefs[key] ? (
                      <ToggleRight className="w-8 h-8 text-[#006e2d]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[#bccbb9]" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
