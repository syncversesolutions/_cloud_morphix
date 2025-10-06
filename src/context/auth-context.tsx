"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/services/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isPlatformAdmin: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isPlatformAdmin: false,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const fetchProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUserProfile(null);
      setIsPlatformAdmin(false);
      return;
    }
    try {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      setIsPlatformAdmin(profile?.isPlatformAdmin ?? false);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfile(null);
      setIsPlatformAdmin(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      fetchProfile(user).finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const refreshUserProfile = async () => {
    setLoading(true);
    await fetchProfile(user);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isPlatformAdmin, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
