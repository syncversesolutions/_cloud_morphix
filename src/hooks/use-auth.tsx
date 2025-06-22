"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import type { UserProfile as UserProfileType } from "@/services/firestore";

export const useAuth = () => {
  return useContext(AuthContext);
};

export type UserProfile = UserProfileType;
