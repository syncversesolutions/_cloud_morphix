
"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import type { UserProfile as UserProfileType } from "@/services/firestore";

export const useAuth = () => {
  return useContext(AuthContext);
};

// This type now represents the fully composed user profile object
// which includes the user's permissions.
export type UserProfile = UserProfileType;
