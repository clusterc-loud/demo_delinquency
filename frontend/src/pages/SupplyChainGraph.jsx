import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Bell, Settings } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const NODES = [
  { id: 1, x: 200, y: 200, r: 12, name: 'Agri-Solutions Ltd', risk: 'low', fill: '#006e2d' },
  { id: 2, x: 400, y: 300, r: 16, name: 'Global Logistics Hub', risk: 'low', fill: '#006e2d' },
  { id: 3, x: 600, y: 250, r: 14, name: 'Precision Parts Co', risk: 'moderate', fill: '#1db954' },
  { id: 4, x: 300, y: 500, r: 10, name: 'Regional Bottling', risk: 'low', fill: '#c5e8d5' },
  { id: 5, x: 500, y: 450, r: 12, name: 'Textile Exports', risk: 'low', fill: '#006e2d' },
  { id: 6, x: 750, y: 400, r: 18, name: 'Apex Manufacturing', risk: 'high', fill: '#ba1a1a', pulse: true },
  { id: 7, x: 850, y: 550, r: 22, name: 'Bharat Heavy Casting', risk: 'high', fill: '#ba1a1a', pulse: true },
];

const EDGES = [
  { from: 1, to: 2, contagion: false, opacity: 0.4, width: 2 },
  { from: 1, to: 4, contagion: false, opacity: 0.3, width: 1 },
  { from: 2, to: 3, contagion: false, opacity: 0.6, width: 5 },
  { from: 2, to: 5, contagion: false, opacity: 0.4, width: 3 },
  { from: 3, to: 6, contagion: true, opacity: 1, width: 4 },
  { from: 5, to: 6, contagion: true, opacity: 0.6, width: 2 },
  { from: 6, to: 7, contagion: true, opacity: 1, width: 6 },
];

const SECTORS = [
  { icon: '🏭', label: 'Manufacturing' },
  { icon: '🌿', label: 'Agriculture', active: true },
  { icon: '⚡', label: 'Tech' },
  { icon: '🚛', label: 'Logistics' },
];

export default function SupplyChainGraph() {
  const navigate = useNavigate();
  const [showContagion, setShowContagion] = useState(true);
  const [hopDepth, setHopDepth] = useState(3);
  const [nodes, setNodes] = useState(NODES);
  const [edges, setEdges] = useState(EDGES);
  const [tooltip, setTooltip] = useState(null);
  const [activeSectors, setActiveSectors] = useState(['Agriculture']);

  useEffect(() => {
    api.get('/msme/graph').then(({ data }) => {
      if (data?.nodes) {
        setNodes(data.nodes.map((n, i) => {
          // Arrange circularly or randomly based on index to prevent overlap
          const angle = (i / data.nodes.length) * Math.PI * 2;
          const radius = 250 + (Math.random() * 100);
          return {
            id: n.id,
            x: 550 + radius * Math.cos(angle),
            y: 400 + radius * Math.sin(angle),
            r: 10 + (Math.random() * 8),
            name: n.businessName,
            risk: n.distressLevel.toLowerCase(),
            fill: n.distressLevel === 'HEALTHY' ? '#006e2d' : (n.distressLevel === 'CRITICAL' ? '#ba1a1a' : '#1db954'),
            pulse: n.distressLevel === 'CRITICAL'
          };
        }));
      }
      if (data?.edges) {
        setEdges(data.edges.map(e => ({
          from: e.source,
          to: e.target,
          contagion: e.paymentStatus === 'DEFAULTED',
          opacity: e.paymentStatus === 'DEFAULTED' ? 1 : 0.4,
          width: e.paymentStatus === 'DEFAULTED' ? 4 : 2
        })));
      }
    }).catch(() => {});
  }, []);

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const toggleSector = (label) => {
    setActiveSectors((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  return (
    <div className="bg-[#f0fdf1] text-[#131e17] min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="bg-[#131e17] flex justify-between items-center w-full px-6 py-3 fixed top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          <div className="w-8 h-8 bg-[#006e2d] rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          VittChetak
        </div>
        <div className="hidden md:flex gap-8">
          {[
            { label: 'Portfolio Overview', to: '/dashboard' },
            { label: 'Flagged Accounts', to: '/flagged' },
            { label: 'MSME Monitor', to: '/supply-chain', active: true },
            { label: 'Intervention Queue', to: '/interventions' },
          ].map(({ label, to, active }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`text-sm font-semibold transition-colors ${active ? 'text-[#1db954] border-b-2 border-[#1db954] pb-1' : 'text-gray-300 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-300 hover:bg-[#1db954]/10 rounded-full transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-300 hover:bg-[#1db954]/10 rounded-full transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex pt-14 relative">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 fixed left-0 top-14 bottom-0 bg-[#f0fdf1] flex-col p-4 gap-2 z-40 border-r border-[#e4f1e5]">
          <div className="px-4 py-6 mb-4">
            <h3 className="text-lg font-black text-[#131e17]">Admin Portal</h3>
            <p className="text-xs font-semibold text-[#006e2d] opacity-70">VittChetak Intelligence</p>
          </div>
          {[
            { label: 'Portfolio Overview', to: '/dashboard' },
            { label: 'Flagged Accounts', to: '/flagged' },
            { label: 'MSME Monitor', to: '/supply-chain', active: true },
            { label: 'Intervention Queue', to: '/interventions' },
            { label: 'Fraud Review', to: '/fraud' },
            { label: 'Audit Trail', to: '#' },
          ].map(({ label, to, active }) => (
            <button
              key={label}
              onClick={(e) => {
                if (to !== '#') {
                  navigate(to);
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold w-full text-left ${active ? 'bg-[#1db954] text-white shadow-lg' : 'text-[#131e17] hover:bg-[#1db954]/5'}`}
            >
              {label}
            </button>
          ))}
         
          <div className="mt-auto p-4 bg-[#006e2d]/5 rounded-2xl">
            <button
              onClick={() => navigate('/supply-chain')}
              className="w-full py-3 bg-gradient-to-r from-[#006e2d] to-[#1db954] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
            >
              + New Analysis
            </button>
          </div>
        </aside>

        {/* Supply Chain Canvas */}
        <section className="flex-1 relative bg-[#f0fdf1] overflow-hidden lg:ml-64">
          {/* Dot Grid Background */}
          <div
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#006e2d 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />

          {/* Title */}
          <div className="absolute top-6 left-6 z-10 space-y-2">
            <h1 className="text-4xl font-extrabold text-[#131e17]">Supply Chain Graph</h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1 bg-[#1db954]/10 text-[#004118] rounded-full text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#006e2d] animate-pulse" />
                Live Ecosystem
              </span>
              <span className="text-[#3d4a3d] text-sm">Monitoring 2,481 Active Nodes</span>
            </div>
          </div>

          {/* SVG Graph */}
          <svg
            viewBox="0 0 1100 800"
            className="w-full h-full"
            style={{ minHeight: 'calc(100vh - 3.5rem)' }}
          >
            {/* Edges */}
            <g>
              {edges.map((e, i) => {
                const from = nodeMap[e.from];
                const to = nodeMap[e.to];
                if (!from || !to) return null;
                const isContagion = e.contagion && showContagion;
                return (
                  <path
                    key={i}
                    d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                    stroke={isContagion ? '#ba1a1a' : '#006e2d'}
                    strokeWidth={e.width}
                    opacity={e.opacity}
                    className={isContagion ? 'contagion-path' : ''}
                    fill="none"
                  />
                );
              })}
            </g>
            {/* Nodes */}
            <g>
              {nodes.map((node) => (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => navigate(`/customer/${node.id}`)}
                  onMouseEnter={() => setTooltip(node)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <circle
                    r={node.r}
                    fill={node.fill}
                    className={node.pulse ? 'node-pulse' : ''}
                  />
                  <text
                    textAnchor="middle"
                    y={node.r + 14}
                    fontSize="10"
                    fontWeight="bold"
                    fill={node.risk === 'high' ? '#ba1a1a' : '#131e17'}
                  >
                    {node.name}
                  </text>
                </g>
              ))}
            </g>
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute bg-white/90 backdrop-blur-lg p-5 rounded-xl shadow-2xl border border-[#006e2d]/10 w-64 pointer-events-none z-20"
              style={{ left: tooltip.x + 30, top: tooltip.y - 40 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-sm">{tooltip.name}</h4>
                {tooltip.risk === 'high' && (
                  <span className="px-2 py-0.5 bg-[#ffdad6] text-[#93000a] text-[10px] font-black rounded-full">CRITICAL</span>
                )}
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#3d4a3d]">Risk Level</span>
                  <span className="font-bold capitalize">{tooltip.risk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3d4a3d]">ID</span>
                  <span className="font-bold">MSME-{tooltip.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-6 z-10">
            {[
              { color: '#006e2d', label: 'Low Risk' },
              { color: '#1db954', label: 'Moderate' },
              { color: '#ba1a1a', label: 'High Risk / Stressed' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs font-bold text-[#131e17]">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right Controls Panel */}
        <section className="w-80 lg:w-96 bg-[#eaf7eb] border-l border-[#e4f1e5] h-screen overflow-y-auto fixed right-0 top-14 p-8">
          <div className="space-y-8">
            {/* Ecosystem Controls */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#131e17]">Ecosystem Controls</h2>
              <div className="space-y-6">
                {/* Sector Filter */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#3d4a3d] block mb-3">Sector Filter</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map(({ icon, label, active }) => (
                      <button
                        key={label}
                        onClick={() => toggleSector(label)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeSectors.includes(label) ? 'bg-[#006e2d] text-white' : 'bg-white text-[#006e2d] border border-[#006e2d]/20 hover:bg-[#006e2d]/5'}`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hop Depth Slider */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#3d4a3d] block mb-3">
                    Network Hop Depth ({hopDepth})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={hopDepth}
                    onChange={(e) => setHopDepth(Number(e.target.value))}
                    className="w-full h-2 bg-[#c5e8d5] rounded-lg appearance-none cursor-pointer accent-[#006e2d]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-[#3d4a3d] mt-2">
                    <span>Immediate</span>
                    <span>Global Cascade</span>
                  </div>
                </div>

                {/* Contagion Toggle */}
                <div className="p-6 bg-white rounded-2xl border border-[#006e2d]/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#131e17]">Show Contagion Path</span>
                    <button
                      onClick={() => setShowContagion((prev) => !prev)}
                      className={`w-12 h-6 rounded-full relative p-1 flex items-center transition-all duration-300 ${showContagion ? 'bg-[#006e2d] justify-end' : 'bg-[#d9e6da] justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow" />
                    </button>
                  </div>
                  <p className="text-xs text-[#3d4a3d] leading-relaxed italic">
                    Highlights downstream nodes likely to experience liquidity stress due to primary default.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3d4a3d] mb-4">High-Impact Interventions</h3>
              <div className="bg-[#1db954]/10 p-4 rounded-2xl border border-[#1db954]/20">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#1db954] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    🧠
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#131e17]">AI Recommendation</h4>
                    <p className="text-[10px] font-medium text-[#3d4a3d]">Predictive Shield Active</p>
                  </div>
                </div>
                <p className="text-xs text-[#131e17] mb-4 leading-relaxed">
                  A liquidity infusion of <span className="font-bold text-[#006e2d]">₹33L</span> to{' '}
                  <span className="font-bold underline">Precision Parts Co</span> could break the default chain and save 8 downstream entities.
                </p>
                <button className="w-full py-2.5 bg-[#006e2d] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#004118] transition-colors">
                  Execute Infusion
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f0fdf1] py-8 w-full flex flex-col items-center justify-center gap-4 lg:pl-64 lg:pr-96 z-10">
        <div className="flex gap-8">
          {['Privacy Policy', 'Terms of Service', 'Regulatory Disclosures'].map((l) => (
            <a key={l} href="#" className="text-xs font-medium text-[#131e17]/60 hover:text-[#1db954] transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs font-medium text-[#131e17]/60">© 2024 VittChetak FinTech. Secured by Tonal Trust.</p>
      </footer>
    </div>
  );
}
