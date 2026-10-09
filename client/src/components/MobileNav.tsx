import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Users, Settings } from 'lucide-react';

export const MobileNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-6 py-2 flex items-center justify-around">
      <NavLink
        to="/app"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 transition ${
            isActive ? 'text-blue-500 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[11px]">Chats</span>
      </NavLink>

      <NavLink
        to="/contacts"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 transition ${
            isActive ? 'text-blue-500 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Users className="w-5 h-5" />
        <span className="text-[11px]">Contacts</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 transition ${
            isActive ? 'text-blue-500 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Settings className="w-5 h-5" />
        <span className="text-[11px]">Settings</span>
      </NavLink>
    </nav>
  );
};
