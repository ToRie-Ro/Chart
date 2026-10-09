import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../lib/types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; isFallback?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  isDemoMode: boolean;
  enableDemoMode: () => void;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_PROFILE: UserProfile = {
  id: 'demo-user-12345',
  display_name: 'Alex Johnson',
  username: 'alexsj',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: "Just a guy who loves tech, travel and good conversations. Let's connect! 🚀",
  status: 'online',
  last_seen: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('bluewave-demo-mode') === 'true';
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        const apiProfile = await api.getCurrentProfile().catch(() => null);
        if (apiProfile) setProfile(apiProfile);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      const savedUser = localStorage.getItem('bluewave-custom-user');
      const savedProfile = localStorage.getItem('bluewave-custom-profile');
      if (savedUser && savedProfile) {
        try {
          setUser(JSON.parse(savedUser));
          setProfile(JSON.parse(savedProfile));
          setLoading(false);
          return;
        } catch {
          // Fallback
        }
      }

      setUser({
        id: DEMO_USER_PROFILE.id,
        email: 'alex@example.com',
        user_metadata: { full_name: 'Alex Johnson' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User);
      setProfile(DEMO_USER_PROFILE);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemoMode]);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      // Seamless preview fallback so users can create accounts and test immediately
      const customUser = {
        id: `user-${Date.now()}`,
        email,
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      const customProfile: UserProfile = {
        id: customUser.id,
        display_name: fullName || email.split('@')[0],
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Hello! I just joined Bluewave Chat 🌊',
        status: 'online',
        last_seen: new Date().toISOString(),
      };

      setUser(customUser);
      setProfile(customProfile);
      setIsDemoMode(true);
      localStorage.setItem('bluewave-demo-mode', 'true');
      localStorage.setItem('bluewave-custom-user', JSON.stringify(customUser));
      localStorage.setItem('bluewave-custom-profile', JSON.stringify(customProfile));

      return { success: true, isFallback: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true };
      }

      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Seamless preview login
      const customUser = {
        id: `user-${email.split('@')[0]}`,
        email,
        user_metadata: { full_name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      const customProfile: UserProfile = {
        id: customUser.id,
        display_name: email.split('@')[0],
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Hello! I am using Bluewave Chat 🌊',
        status: 'online',
        last_seen: new Date().toISOString(),
      };

      setUser(customUser);
      setProfile(customProfile);
      setIsDemoMode(true);
      localStorage.setItem('bluewave-demo-mode', 'true');
      localStorage.setItem('bluewave-custom-user', JSON.stringify(customUser));
      localStorage.setItem('bluewave-custom-profile', JSON.stringify(customProfile));

      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.user) await fetchProfile(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Login failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const signOut = async () => {
    setIsDemoMode(false);
    localStorage.removeItem('bluewave-demo-mode');
    localStorage.removeItem('bluewave-custom-user');
    localStorage.removeItem('bluewave-custom-profile');

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request password reset' };
    }
  };

  const updateUserPassword = async (password: string) => {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (isDemoMode || !isSupabaseConfigured) {
      setProfile((prev) => {
        const next = prev ? { ...prev, ...data } : null;
        if (next) localStorage.setItem('bluewave-custom-profile', JSON.stringify(next));
        return next;
      });
      return;
    }

    if (user) {
      const updated = await api.updateProfile(data);
      setProfile(updated);
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('bluewave-demo-mode', 'true');
    setUser({
      id: DEMO_USER_PROFILE.id,
      email: 'alex@example.com',
      user_metadata: { full_name: 'Alex Johnson' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User);
    setProfile(DEMO_USER_PROFILE);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        updateUserPassword,
        updateUserProfile,
        isDemoMode,
        enableDemoMode,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
