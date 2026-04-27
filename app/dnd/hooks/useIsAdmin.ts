"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/auth/AuthContext";

/**
 * Returns true only if the current user has the `admin` custom claim
 * set server-side via the Firebase Admin SDK.
 *
 * Custom claims are attached to the JWT and cannot be spoofed client-side.
 * The user must sign out and back in after the claim is first granted.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    user.getIdTokenResult().then((tokenResult) => {
      setIsAdmin(tokenResult.claims.admin === true);
    });
  }, [user]);

  return isAdmin;
}