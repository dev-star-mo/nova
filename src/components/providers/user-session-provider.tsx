"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

type UserSessionContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(data as Profile | null);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signOut = useCallback(async () => {
    const wasAdmin = profile?.role === "admin";
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    
    // If admin or on admin page, redirect to home and reload
    if (wasAdmin || window.location.pathname.startsWith("/admin")) {
      window.location.href = "/";
    } else {
      window.location.reload();
    }
  }, [supabase, profile?.role]);

  const value = useMemo<UserSessionContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      refreshProfile,
      signOut,
    }),
    [user, profile, loading, refreshProfile, signOut]
  );

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
}

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) throw new Error("useUserSession must be used within UserSessionProvider");
  return ctx;
}
