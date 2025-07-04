
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
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        // The source of truth is now the profile itself.
        setIsPlatformAdmin(profile?.isPlatformAdmin ?? false);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUserProfile(null);
        setIsPlatformAdmin(false);
      }
    } else {
      setUserProfile(null);
      setIsPlatformAdmin(false);
    }
    // Set loading to false only after all async operations are done.
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Reset state and start loading when auth state changes
      setLoading(true);
      setUser(user);
      fetchProfile(user);
    });

    return () => unsubscribe();
  }, [fetchProfile]);
  
  const refreshUserProfile = async () => {
    setLoading(true);
    await fetchProfile(user);
    setLoading(false);
  };

  const value = { user, userProfile, loading, isPlatformAdmin, refreshUserProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
