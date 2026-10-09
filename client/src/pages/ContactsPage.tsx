import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { MobileNav } from '../components/MobileNav';
import { Search, MessageSquare, UserPlus, Users, Loader2 } from 'lucide-react';
import { UserProfile } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fallbackContacts: UserProfile[] = [
    {
      id: 'user-alex',
      display_name: 'Alex Johnson',
      username: 'alexsj',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: "Just a guy who loves tech, travel and good conversations. Let's connect! 🚀",
      status: 'online',
    },
    {
      id: 'user-sarah',
      display_name: 'Sarah Wilson',
      username: 'sarahw',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Designer & Coffee lover ☕',
      status: 'online',
    },
    {
      id: 'user-mike',
      display_name: 'Mike Chen',
      username: 'mikec',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Full-stack software engineer',
      status: 'offline',
    },
    {
      id: 'user-emma',
      display_name: 'Emma Davis',
      username: 'emmad',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      bio: 'Creative director & explorer ✈️',
      status: 'online',
    },
    {
      id: 'user-daniel',
      display_name: 'Daniel Brown',
      username: 'danielb',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Frontend developer @ Chart',
      status: 'away',
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const results = await api.searchUsers(query);
        if (results && results.length > 0) {
          setContacts(results);
        } else {
          setContacts(
            fallbackContacts.filter(
              (c) =>
                c.display_name.toLowerCase().includes(query.toLowerCase()) ||
                c.username.toLowerCase().includes(query.toLowerCase())
            )
          );
        }
      } catch {
        setContacts(
          fallbackContacts.filter(
            (c) =>
              c.display_name.toLowerCase().includes(query.toLowerCase()) ||
              c.username.toLowerCase().includes(query.toLowerCase())
          )
        );
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      <Navbar unreadTotal={5} />

      {/* Main Contacts Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center pb-20 md:pb-8">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Contacts & Search</h1>
              <p className="text-xs text-slate-400 mt-1">Find friends, colleagues, and community members</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition shadow-inner"
            />
          </div>

          {/* Contacts Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <span className="text-xs">Searching users...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No contacts found matching "{query}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between gap-3 shadow-md"
                >
                  <div
                    onClick={() => navigate(`/profile/${contact.id}`)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-900 ring-2 ring-slate-800 flex-shrink-0">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt={contact.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-white bg-blue-600">
                          {contact.display_name.charAt(0)}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                          contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate hover:text-cyan-400 transition">
                        {contact.display_name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">@{contact.username}</p>
                      {contact.bio && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{contact.bio}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/app')}
                    className="p-2.5 bg-blue-600/10 hover:bg-blue-600 text-cyan-400 hover:text-white rounded-xl transition flex-shrink-0"
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
};
