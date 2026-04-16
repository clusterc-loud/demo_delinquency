import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, FileText, Network, Zap, TrendingDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import HealthScoreGauge from '../components/HealthScoreGauge';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const MOCK_PROFILE = {
  id: 'VC-18842',
  name: 'Global Logistics Pvt Ltd',
  segment: 'MSME',
  regNo: '20455/MH/2021',
  riskScore: 38,
  stressLabel: 'Critical — Immediate Intervention Required',
  dimensionScores: {
    'Cash Flow Stability': 28,
    'Debt Servicing': 45,
    'Operational Continuity': 55,
    'Revenue Diversification': 62,
    'Ecosystem Dependency': 30,
  },
  survivalData: [
    { month: 1, probability: 92 },
    { month: 2, probability: 85 },
    { month: 3, probability: 75 },
    { month: 4, probability: 62 },
    { month: 5, probability: 47 },
    { month: 6, probability: 38 },
  ],
  timeline: [
    { date: 'Oct 10, 2023', action: 'SMS sent — EMI Reminder', outcome: 'Unread', type: 'sms' },
    { date: 'Oct 05, 2023', action: 'AI Health Score Update', outcome: 'Score: 38', type: 'score' },
    { date: 'Sep 28, 2023', action: 'Email sent — Payment Advisory', outcome: 'Opened', type: 'email' },
  ],
  networkRisk: { exposedEntities: 14, contagionProbability: 72, directExposure: '₹48L' },
};

export default function Customer360() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [loading, setLoading] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/customer/${id}/profile`)
      .then(({ data }) => { if (data) setProfile((prev) => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const { data } = await api.post(`/customer/${id}/rescore`);
      const newScore = data?.financialHealthScore ?? data?.riskScore;
      if (newScore !== undefined) {
        setProfile((prev) => ({ ...prev, riskScore: newScore }));
        addToast(`Rescore complete — New score: ${newScore}. Risk anchored to Algorand blockchain.`, 'success');
      } else {
        addToast('Rescore complete. Score updated.', 'success');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Rescore failed. ML service may be offline.';
      addToast(msg, 'error');
    } finally {
      setRescoring(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f0fdf1] min-h-screen">
        <Sidebar />
        <main className="ml-64 p-8"><SkeletonLoader type="card" rows={6} /></main>
      </div>
    );
  }

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{profile.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1db954]/20 text-[#004118] uppercase tracking-wider">{profile.segment}</span>
              <span className="text-sm text-[#3d4a3d] font-medium">Reg: {profile.regNo}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRescore}
              disabled={rescoring}
              className="px-4 py-2 bg-[#d9e6da] text-[#131e17] text-sm font-bold rounded-xl hover:bg-[#c5e8d5] transition-colors flex items-center gap-2"
            >
              {rescoring ? <span className="w-4 h-4 border-2 border-[#006e2d] border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              Rescore
            </button>
          </div>
        </header>

        {/* Main 12-col Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Profile Column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Health Gauge Card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10 flex flex-col items-center">
              <HealthScoreGauge score={profile.riskScore} size={192} label={profile.riskScore < 40 ? 'CRITICAL' : profile.riskScore < 60 ? 'MODERATE' : 'STRONG'} />
              <p className="mt-4 text-center text-xs font-semibold text-[#ba1a1a] leading-snug max-w-xs">
                {profile.stressLabel}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#3d4a3d] mb-4">Quick Actions</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Phone className="w-5 h-5" />, label: 'Call', primary: false, onClick: () => addToast('Connecting to RM...', 'success') },
                  { icon: <Mail className="w-5 h-5" />, label: 'Email', primary: false, onClick: () => addToast('Advisory Email Sent.', 'success') },
                  { icon: <FileText className="w-5 h-5" />, label: 'Restructure', primary: true, onClick: () => navigate(`/interventions?customerId=${id}`) },
                ].map((btn, i) => (
                  <button 
                    key={i} 
                    onClick={btn.onClick}
                    className={`py-3 px-2 rounded-xl flex flex-col items-center gap-1.5 transition-all ${btn.primary ? 'bg-[#006e2d] text-white hover:bg-[#004118]' : 'bg-[#eaf7eb] text-[#131e17] hover:bg-[#d9e6da]'}`}
                  >
                    {btn.icon}
                    <span className="text-[10px] font-bold">{btn.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate(`/interventions?customerId=${id}`)}
                className="mt-4 w-full bg-gradient-to-r from-[#006e2d] to-[#1db954] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Send Intervention
              </button>
            </div>

            {/* Survival Curve */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#bccbb9]/10">
              <h4 className="text-sm font-bold text-[#131e17] mb-1">6-Month Survival Curve</h4>
              <p className="text-[10px] text-[#3d4a3d] mb-4 uppercase font-bold tracking-widest">Probability of no default</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.survivalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4f1e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={(v) => `M${v}`} />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Survival Prob']} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="probability" stroke="#ba1a1a" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profile Navigation */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bccbb9]/10 space-y-2">
              {profile.segment === 'Retail' ? (
                <button onClick={() => navigate(`/customer/${id}/retail`)} className="w-full text-left text-sm font-bold text-[#006e2d] px-4 py-3 rounded-xl hover:bg-[#eaf7eb] flex items-center justify-between">
                  View Retail Profile <Network className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => navigate(`/customer/${id}/msme`)} className="w-full text-left text-sm font-bold text-[#006e2d] px-4 py-3 rounded-xl hover:bg-[#eaf7eb] flex items-center justify-between">
                  View MSME Profile <Network className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Content Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Business Vitals (MSME Only) */}
            {profile.segment === 'MSME' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
                <h3 className="text-lg font-bold mb-6 text-[#131e17]">Business Vitals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Industry', value: profile.industrySector || 'General' },
                    { label: 'Business Age', value: `${profile.businessAgeYears || 0} Yrs` },
                    { label: 'Turnover', value: profile.annualTurnoverBand || 'N/A' },
                    { label: 'Utilization', value: `${((profile.mlFeatures?.msme?.revolUtil || 0) * 100).toFixed(1)}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#f0fdf1] p-3 rounded-lg border border-[#1db954]/10">
                      <p className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest">{stat.label}</p>
                      <p className="text-sm font-black text-[#131e17] mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Dimensions */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
              <h3 className="text-lg font-bold mb-6 text-[#131e17]">Risk Dimensions</h3>
              <div className="space-y-5">
                {Object.entries(profile.dimensionScores).map(([dim, score]) => (
                  <div key={dim}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">{dim}</span>
                      <span className={`text-sm font-black ${score < 40 ? 'text-[#ba1a1a]' : score < 60 ? 'text-yellow-600' : 'text-[#006e2d]'}`}>{score}/100</span>
                    </div>
                    <div className="h-2 bg-[#e4f1e5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${score < 40 ? 'bg-[#ba1a1a]/60' : score < 60 ? 'bg-yellow-400' : 'bg-[#1db954]'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supply Chain Graph (MSME Only) */}
            {profile.segment === 'MSME' && profile.supplyChainPartners?.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-[#131e17]">Supply Chain Relationship Graph</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#006e2d]" /> Stable</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Watch</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ba1a1a]" /> Critical</div>
                  </div>
                </div>
                <div className="relative h-48 bg-[#f0fdf1]/30 rounded-2xl flex items-center justify-center border border-dashed border-[#1db954]/20">
                   {/* Main Node */}
                   <div className="z-10 bg-[#006e2d] text-white p-4 rounded-2xl shadow-lg border-4 border-white flex flex-col items-center">
                      <span className="text-[10px] font-bold opacity-70 uppercase">Anchor</span>
                      <span className="text-xs font-black">{profile.businessName?.split(' ')[0] || 'Entity'}</span>
                   </div>
                   
                   {/* Connections and Partner Nodes */}
                   {profile.supplyChainPartners.map((partner, i) => {
                      const angle = (i * (360 / profile.supplyChainPartners.length)) * (Math.PI / 180);
                      const x = Math.cos(angle) * 110;
                      const y = Math.sin(angle) * 70;
                      const color = partner.status === 'STABLE' ? '#006e2d' : partner.status === 'WATCH' ? '#eab308' : '#ba1a1a';
                      return (
                        <div key={partner.name} className="absolute" style={{ transform: `translate(${x}px, ${y}px)` }}>
                           {/* Line to center */}
                           <div className="absolute top-1/2 left-1/2 w-[110px] h-[2px] opacity-20 origin-left" style={{ background: color, transform: `rotate(${angle + Math.PI}rad) translateX(20px)` }} />
                           <div className="relative z-10 bg-white p-2 rounded-xl border-2 shadow-sm flex flex-col items-center min-w-[80px]" style={{ borderColor: color }}>
                              <span className="text-[9px] font-black whitespace-nowrap">{partner.name}</span>
                              <span className="text-[8px] font-bold opacity-60">{partner.health}% Health</span>
                           </div>
                        </div>
                      )
                   })}
                </div>
                <p className="mt-4 text-[11px] text-[#3d4a3d] italic text-center">AI Analysis: High exposure to {profile.supplyChainPartners.find(p => p.status === 'CRITICAL')?.name || 'upstream'} disruption.</p>
              </div>
            )}

            {/* Network Risk */}
            <div className="bg-[#ffdad6]/30 border border-[#ba1a1a]/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-[#131e17] mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-[#ba1a1a]" />
                Network Contagion Risk
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Exposed Entities', value: profile.networkRisk.exposedEntities },
                  { label: 'Contagion Prob', value: `${profile.networkRisk.contagionProbability}%` },
                  { label: 'Direct Exposure', value: profile.networkRisk.directExposure },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-black text-[#ba1a1a]">{value}</p>
                    <p className="text-[10px] font-bold text-[#3d4a3d] uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Intervention Timeline */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-[#bccbb9]/10">
              <h3 className="text-lg font-bold mb-6">Intervention Timeline</h3>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-[#e4f1e5]" />
                {profile.timeline.map((item, i) => (
                  <div key={i} className="pl-12 pb-6 relative">
                    <div className="absolute left-[14px] top-1 w-3 h-3 rounded-full border-2 border-[#1db954] bg-white" />
                    <p className="text-[10px] text-[#3d4a3d] font-bold uppercase tracking-widest mb-1">{item.date}</p>
                    <p className="text-sm font-semibold">{item.action}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.outcome === 'Opened' ? 'bg-[#72fe8f]/30 text-[#006e2d]' : item.outcome === 'Unread' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#d9e3fb] text-[#2e384b]'}`}>
                      {item.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
