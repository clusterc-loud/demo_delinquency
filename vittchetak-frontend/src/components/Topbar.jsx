import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';

/**
 * Topbar — Dark top navigation bar
 * Props: { title: string, breadcrumb?: string }
 */
export default function Topbar({ title = 'Dashboard', breadcrumb }) {
  const [syncedMins, setSyncedMins] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncedMins((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem('vc_user')); } catch { return null; }
  })();

  return (
    <header className="bg-[#131e17] sticky top-0 z-40 flex justify-between items-center w-full px-8 py-4">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight text-white font-headline">
          {breadcrumb ? (
            <span>
              <span className="text-gray-400 font-normal">{breadcrumb} /</span>{' '}
              {title}
            </span>
          ) : (
            title
          )}
        </h1>
        {/* Sync indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 ml-4">
          <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse flex-shrink-0" />
          <span>
            {syncedMins === 0 ? 'Just synced' : `Synced ${syncedMins} min ago`}
          </span>
        </div>
      </div>

      {/* Right: Search + Notifs + Avatar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/10 border-none rounded-full pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#1db954] w-48 placeholder:text-gray-500"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-gray-300 hover:bg-white/10 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#1db954] rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#1db954] flex items-center justify-center text-white text-sm font-black overflow-hidden border-2 border-white/10">
          <span>{user?.name?.[0] || 'A'}</span>
        </div>
      </div>
    </header>
  );
}
