import { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ChatInbox() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = () => {
      api.get('/chat/lists/inbox')
        .then(({ data }) => setChats(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-[#3d4a3d] font-bold">Loading secure messages...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#bccbb9]/20 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-[#bccbb9]/10 bg-[#f0fdf1]/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-[#131e17] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1db954]" />
            Smart Messaging Inbox
          </h3>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#3d4a3d]/60 mt-1">Bilateral Client Communication</p>
        </div>
        <span className="bg-[#1db954] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {chats.length} ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chats.length === 0 ? (
          <div className="p-10 text-center text-[#3d4a3d]/40 italic text-sm">No recent conversations.</div>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.customerId}
              onClick={() => navigate(`/interventions?customerId=${chat.customerId}`)}
              className="group p-4 border-b border-[#bccbb9]/5 hover:bg-[#eaf7eb] transition-all cursor-pointer flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-xl bg-[#d9e6da] flex items-center justify-center text-[#1db954] font-bold flex-shrink-0 group-hover:bg-[#1db954] group-hover:text-white transition-all">
                {chat.name?.[0] || <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="text-sm font-bold truncate text-[#131e17]">{chat.name}</h4>
                  <span className="text-[9px] font-bold text-[#3d4a3d]/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#3d4a3d] truncate font-medium">
                  <span className="font-bold text-[#1db954] mr-1">{chat.sender === 'CUSTOMER' ? 'Client:' : 'You:'}</span>
                  {chat.lastMessage}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#bccbb9] mt-1 group-hover:text-[#1db954] transition-all" />
            </div>
          ))
        )}
      </div>
      
      <button 
        onClick={() => navigate('/interventions')}
        className="p-4 text-center text-xs font-bold text-[#006e2d] bg-[#eaf7eb] hover:bg-[#d9e6da] transition-all border-t border-[#bccbb9]/10"
      >
        View All Interventions
      </button>
    </div>
  );
}
