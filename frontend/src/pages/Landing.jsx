import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Building2, Shield, Brain, Network } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🧠',
      title: 'Cognitive Behavioral Analysis',
      desc: 'Analyzing payment micro-patterns and digital footprints to detect psychological shifts in credit behavior.',
    },
    {
      icon: '🔗',
      title: 'MSME Ecosystem Monitoring',
      desc: 'Supply chain integrity tracking to alert you when a borrower\'s primary buyer is facing liquidity issues.',
    },
  ];

  const trustBrands = [
    { icon: <Building2 className="w-5 h-5" />, name: 'Boreal Trust' },
    { icon: <Shield className="w-5 h-5" />, name: 'Shield Cap' },
    { icon: <Brain className="w-5 h-5" />, name: 'Grow Bank' },
  ];

  return (
    <div className="text-[#131e17] overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="bg-[#131e17] flex justify-between items-center w-full px-6 py-3 fixed top-0 z-50 shadow-sm">
        <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#1db954]" />
          VittChetak
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a href="#" className="text-[#1db954] border-b-2 border-[#1db954] pb-1 text-sm font-semibold font-headline">Home</a>
          <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-semibold font-headline hover:bg-[#1db954]/10 px-2 py-1 rounded">Solutions</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-semibold font-headline hover:bg-[#1db954]/10 px-2 py-1 rounded">Technology</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-semibold font-headline hover:bg-[#1db954]/10 px-2 py-1 rounded">Security</a>
        </div>
        <div></div>
      </nav>

      {/* Hero Section */}
      <main className="relative min-h-screen pt-24 pb-12 px-6 lg:px-24 flex flex-col justify-center bg-gradient-to-b from-[#f0fdf1] to-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto w-full">
          {/* Left: Content */}
          <div className="flex flex-col space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#72fe8f] text-[#002108] text-xs font-bold tracking-wider uppercase">
                AI-Powered Intelligence
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-[#131e17] leading-[1.1] tracking-tight">
                Detect the Distress. <br />
                <span className="text-[#006e2d]">Before It Catches Them.</span>
              </h1>
              <p className="text-lg text-[#3d4a3d] max-w-xl leading-relaxed">
                VittChetak's proprietary AI Pre-Delinquency Engine monitors trillions of signals to predict loan stress months in advance. Turn reactive recovery into proactive partnership.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/login')}
                className="primary-gradient text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#006e2d]/20 hover:scale-[1.02] transition-transform active:scale-95"
              >
                Bank Admin Login
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/customer-login')}
                className="border-2 border-[#131e17] text-[#131e17] px-8 py-4 rounded-xl font-bold hover:bg-[#eaf7eb] transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                Customer Login
              </button>
            </div>
            {/* Social Proof Strip */}
            <div className="pt-8">
              <p className="text-xs font-semibold text-[#3d4a3d] uppercase tracking-[0.2em] mb-4">Trusted by modern institutions</p>
              <div className="flex flex-wrap gap-8 opacity-60 grayscale items-center">
                {trustBrands.map(({ icon, name }) => (
                  <div key={name} className="flex items-center gap-1 font-bold text-xl">
                    {icon}
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="relative order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-lg lg:h-[600px] rounded-xl overflow-hidden bg-[#eaf7eb] p-4 shadow-2xl animate-float">
              {/* Dashboard Mockup Header */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-[#131e17]">Portfolio Risk Heatmap</h3>
                    <p className="text-xs text-[#3d4a3d]">Real-time delinquency forecasting</p>
                  </div>
                  <span className="text-[#006e2d] font-bold">⋮</span>
                </div>
                {/* Heatmap Grid */}
                <div className="grid grid-cols-5 gap-2 h-48">
                  <div className="bg-[#006e2d]/10 rounded-md" />
                  <div className="bg-[#006e2d]/20 rounded-md" />
                  <div className="bg-[#006e2d]/30 rounded-md" />
                  <div className="bg-[#ba1a1a]/10 rounded-md" />
                  <div className="bg-[#ba1a1a]/20 rounded-md" />
                  <div className="bg-[#006e2d]/5 rounded-md" />
                  <div className="bg-[#006e2d]/15 rounded-md" />
                  <div className="bg-[#ba1a1a]/40 rounded-md animate-pulse" />
                  <div className="bg-[#006e2d]/25 rounded-md" />
                  <div className="bg-[#006e2d]/5 rounded-md" />
                  <div className="bg-[#006e2d]/40 rounded-md" />
                  <div className="bg-[#ba1a1a]/60 rounded-md animate-pulse" />
                  <div className="bg-[#ba1a1a]/30 rounded-md" />
                  <div className="bg-[#006e2d]/10 rounded-md" />
                  <div className="bg-[#006e2d]/5 rounded-md" />
                </div>
              </div>

              {/* Floating Insight Card */}
              <div className="absolute bottom-12 -left-12 glass-card p-5 rounded-xl shadow-xl w-64 translate-x-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center">
                    <span className="text-[#ba1a1a] text-xl">⚠</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Intervention Alert</h4>
                    <p className="text-[10px] text-[#3d4a3d]">ID: #MSME-8842</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#d9e6da] rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[#ba1a1a]" style={{ width: '82%' }} />
                </div>
                <p className="text-[11px] font-medium text-[#131e17] leading-tight">82% Probability of distress detected within next 45 days.</p>
              </div>

              {/* Floating Success Card */}
              <div className="absolute top-1/2 -right-8 glass-card p-4 rounded-xl shadow-xl w-48 -translate-y-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#1db954] text-xl">✓</span>
                  <span className="text-xs font-bold">Recovered</span>
                </div>
                <div className="text-2xl font-black text-[#131e17] tracking-tight">$42.8k</div>
                <p className="text-[9px] text-[#3d4a3d] uppercase tracking-widest font-bold">Prevented Loss</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-24 bg-[#eaf7eb]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <h2 className="text-4xl font-extrabold text-[#131e17] leading-tight mb-6">
                Built for the <br />
                <span className="text-[#006e2d]">New Era of Credit.</span>
              </h2>
              <p className="text-[#3d4a3d] mb-8 leading-relaxed">
                Traditional credit scores are lagging indicators. VittChetak uses leading behavioral indicators to see what others miss.
              </p>
              <a href="#" className="text-[#006e2d] font-bold flex items-center gap-2 group">
                Explore the Architecture
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`bg-white p-8 rounded-xl shadow-sm ${i % 2 === 1 ? 'translate-y-6' : ''}`}
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-[#3d4a3d] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f0fdf1] py-12 flex flex-col items-center justify-center gap-6 w-full">
        <div className="flex gap-12 mb-4">
          <a href="#" className="text-[#131e17]/60 hover:text-[#1db954] transition-colors text-xs font-medium">Privacy Policy</a>
          <a href="#" className="text-[#131e17]/60 hover:text-[#1db954] transition-colors text-xs font-medium">Terms of Service</a>
          <a href="#" className="text-[#131e17]/60 hover:text-[#1db954] transition-colors text-xs font-medium">Regulatory Disclosures</a>
        </div>
        <div className="flex items-center gap-8 mb-4 grayscale opacity-40">
          <span className="text-2xl">🔐</span>
          <span className="text-2xl">🛡</span>
          <span className="text-2xl">💳</span>
        </div>
        <p className="text-xs font-medium text-[#131e17]/60">© 2024 VittChetak FinTech. Secured by Tonal Trust.</p>
      </footer>
    </div>
  );
}
