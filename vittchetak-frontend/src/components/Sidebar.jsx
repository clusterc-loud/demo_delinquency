import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flag,
  Clock,
  Network,
  ShieldAlert,
  History,
  Settings,
  LogOut,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Portfolio Overview', icon: LayoutDashboard },
  { to: '/flagged', label: 'Flagged Accounts', icon: Flag },
  { to: '/interventions', label: 'Intervention Queue', icon: Clock },
  { to: '/supply-chain', label: 'MSME Monitor', icon: Network },
  { to: '/fraud', label: 'Fraud Review', icon: ShieldAlert },
  { to: '#', label: 'Audit Trail', icon: History },
  { to: '#', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Parse user from sessionStorage if not in context
  const displayUser = user || (() => {
    try { return JSON.parse(sessionStorage.getItem('vc_user')); } catch { return null; }
  })();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f0fdf1] flex flex-col p-4 gap-2 z-40 border-r-0">
      {/* Brand */}
      <div className="px-2 py-6 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1db954] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#1db954]/20">
          <Leaf className="w-5 h-5 fill-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#131e17] leading-tight">Admin Portal</h2>
          <p className="text-[10px] font-semibold text-[#131e17]/60 uppercase tracking-widest">VittChetak Intelligence</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            onClick={(e) => {
              if (to === '#') {
                e.preventDefault();
              }
            }}
            className={({ isActive }) =>
              isActive && to !== '#'
                ? 'bg-[#1db954] text-white rounded-xl shadow-lg shadow-[#1db954]/20 flex items-center gap-3 px-4 py-3 opacity-80 scale-[0.98] transition-all'
                : 'text-[#131e17] hover:bg-[#1db954]/5 hover:translate-x-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200'
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{label}</span>
          </NavLink>
        ))}

        {/* New Analysis Button */}
        <div className="pt-6 px-2">
          <button className="w-full bg-[#1db954] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <span className="text-lg">+</span>
            <span>New Analysis</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[#bccbb9]/20 space-y-1">
        {/* User info */}
        {displayUser && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {displayUser.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#131e17] truncate">{displayUser.name || 'Admin User'}</p>
              <p className="text-[10px] text-[#3d4a3d] truncate">{displayUser.role || 'Analyst'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-[#131e17]/60 hover:bg-[#1db954]/5 hover:translate-x-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
