import React, { useState, useEffect } from 'react';
import { X, Search, Users, User, Loader2 } from 'lucide-react';
import { UserProfile } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  onCreateGroup?: (title: string, userIds: string[]) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  // Sample fallback demo contacts if offline or search empty
  const demoContacts: UserProfile[] = [
    {
      id: 'demo-sarah',
      display_name: 'Sarah Wilson',
      username: 'sarahw',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Designer & Coffee lover ☕',
      status: 'online',
    },
    {
      id: 'demo-mike',
      display_name: 'Mike Chen',
      username: 'mikec',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Full-stack software engineer',
      status: 'offline',
    },
    {
      id: 'demo-emma',
      display_name: 'Emma Davis',
      username: 'emmad',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      bio: 'Creative director & explorer ✈️',
      status: 'online',
    },
    {
      id: 'demo-daniel',
      display_name: 'Daniel Brown',
      username: 'danielb',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Frontend developer @ Bluewave',
      status: 'away',
    },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const results = await api.searchUsers(query);
        if (results && results.length > 0) {
          setUsers(results);
        } else {
          // If search yielded no backend results or demo mode, filter demo contacts
          const filteredDemo = demoContacts.filter(
            (c) =>
              c.display_name.toLowerCase().includes(query.toLowerCase()) ||
              c.username.toLowerCase().includes(query.toLowerCase())
          );
          setUsers(filteredDemo);
        }
      } catch {
        const filteredDemo = demoContacts.filter(
          (c) =>
            c.display_name.toLowerCase().includes(query.toLowerCase()) ||
            c.username.toLowerCase().includes(query.toLowerCase())
        );
        setUsers(filteredDemo);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">Start New Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">Searching users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No users found matching "{query}"
            </div>
          ) : (
            users
              .filter((u) => u.id !== currentUser?.id)
              .map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    onSelectUser(contact);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-blue-900 flex-shrink-0">
                    {contact.avatar_url ? (
                      <img
                        src={contact.avatar_url}
                        alt={contact.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-white bg-blue-600">
                        {contact.display_name.charAt(0)}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                        contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {contact.display_name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">@{contact.username}</p>
                    {contact.bio && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{contact.bio}</p>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
