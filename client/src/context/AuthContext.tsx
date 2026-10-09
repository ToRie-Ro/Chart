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
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string, token?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
        return;
      }
    } catch { /* ignore */ }

    try {
      if (token) {
        const apiProfile = await api.getCurrentProfile().catch(() => null);
        if (apiProfile) setProfile(apiProfile);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.access_token);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.access_token);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Please add your Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) to the Render environment variables, then redeploy the frontend.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) return { success: true };
      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Please add your Supabase credentials to the Render environment variables first.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.user) await fetchProfile(data.user.id, data.session.access_token);
        return { success: true };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset email' };
    }
  };

  const updateUserPassword = async (password: string) => {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured' };
    if (!user) return { success: false, error: 'User is not logged in' };
    try {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.warn('Direct profile update note:', error.message);
        // If error is about banner_url column not existing in DB, save metadata & retry other fields
        if (error.message?.includes('banner_url')) {
          if (data.banner_url) {
            await supabase.auth.updateUser({ data: { banner_url: data.banner_url } }).catch(() => {});
          }
          const { banner_url, ...rest } = data;
          if (Object.keys(rest).length > 0) {
            await supabase
              .from('profiles')
              .update({ ...rest, updated_at: new Date().toISOString() })
              .eq('id', user.id);
          }
        }
        // Ensure local profile state has the updated fields immediately
        setProfile((prev) => (prev ? { ...prev, ...data } : null));
        return { success: false, error: error.message };
      }

      if (updated) {
        setProfile(updated);
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err: any) {
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
      return { success: false, error: err.message || 'An error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signUp, signIn, signOut,
      resetPasswordForEmail, updateUserPassword, updateUserProfile,
      isConfigured: isSupabaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
