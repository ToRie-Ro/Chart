import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Settings, 
  Plus, 
  Sun, 
  Moon,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  unreadTotal?: number;
  onOpenNewChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ unreadTotal = 5, onOpenNewChat }) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/90 dark:bg-slate-950/95 border-r border-slate-800/80 p-4 justify-between h-screen select-none backdrop-blur-md">
      {/* Top Header */}
      <div className="space-y-6">
        <div className="px-2 py-2">
          <BrandLogo size="md" />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <NavLink
            to="/app"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/app"
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </div>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500 text-slate-950 rounded-full">
                {unreadTotal}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="space-y-4">
        {/* New Chat Button */}
        <button
          onClick={onOpenNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium text-sm hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 shadow-md shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Chat</span>
        </button>

        {/* Theme and Account Footer */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs font-medium transition"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">
              Toggle
            </span>
          </button>

          {/* User mini profile card */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-800/40">
            <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-900 ring-2 ring-blue-500/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-blue-600">
                    {profile?.display_name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{profile?.display_name || 'My Profile'}</p>
                <p className="text-[11px] text-slate-400 truncate">@{profile?.username || 'user'}</p>
              </div>
            </NavLink>

            <button
              onClick={() => signOut()}
              title="Log Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
