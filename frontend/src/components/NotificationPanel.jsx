import { useState, useEffect, useRef } from 'react';
import { Bell, Send, X, MessageSquare, Clock } from 'lucide-react';
import api from '../api/axios';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [sending, setSending] = useState({});
  const panelRef = useRef(null);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/chat/notifications');
        setNotifications(data.notifications || []);
      } catch {
        // silently fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReply = async (customerId) => {
    const text = replyTexts[customerId];
    if (!text?.trim()) return;

    setSending(prev => ({ ...prev, [customerId]: true }));
    try {
      await api.post(`/chat/${customerId}/quick-reply`, { text });
      // Remove from local notifications
      setNotifications(prev => prev.filter(n => n.customerId !== customerId));
      setReplyTexts(prev => ({ ...prev, [customerId]: '' }));
    } catch {
      // handle error silently
    } finally {
      setSending(prev => ({ ...prev, [customerId]: false }));
    }
  };

  const totalUnread = notifications.reduce((sum, n) => sum + n.unreadCount, 0);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full bg-[#d9e6da] flex items-center justify-center text-[#3d4a3d] hover:bg-[#1db954] hover:text-white transition-all"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba1a1a] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-14 w-[420px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#f0fdf1] to-white">
            <div>
              <h3 className="font-extrabold text-sm text-[#131e17]">Customer Messages</h3>
              <p className="text-[10px] text-[#3d4a3d] font-medium mt-0.5">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-400">No pending messages</p>
                <p className="text-[10px] text-gray-300 mt-1">Customer messages will appear here</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.customerId} className="px-5 py-4 border-b border-gray-50 hover:bg-[#f0fdf1]/50 transition-colors">
                  {/* Message Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-white text-xs font-black shrink-0">
                        {n.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#131e17] leading-tight">{n.name}</p>
                        <p className="text-[10px] text-[#3d4a3d] font-medium">{n.customerId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(n.timestamp)}
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 border border-gray-100">
                    <p className="text-xs text-[#131e17] leading-relaxed line-clamp-2">"{n.message}"</p>
                    {n.unreadCount > 1 && (
                      <p className="text-[10px] text-[#1db954] font-bold mt-1">+{n.unreadCount - 1} more message{n.unreadCount - 1 > 1 ? 's' : ''}</p>
                    )}
                  </div>

                  {/* Quick Reply */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={replyTexts[n.customerId] || ''}
                      onChange={(e) => setReplyTexts(prev => ({ ...prev, [n.customerId]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(n.customerId)}
                      placeholder="Quick reply..."
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1db954]/30 focus:border-[#1db954]"
                    />
                    <button
                      onClick={() => handleReply(n.customerId)}
                      disabled={sending[n.customerId] || !replyTexts[n.customerId]?.trim()}
                      className="p-2 bg-[#1db954] text-white rounded-lg hover:bg-[#159a43] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sending[n.customerId] ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
