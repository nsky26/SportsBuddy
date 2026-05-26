import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { getUserProfile, createUserProfileIfMissing } from '../firebase/auth';
import { useAuthStore } from '../store/authStore';

interface AuthContextValue {
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isReady: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    // Clerk hasn't finished loading yet — stay in loading state
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (isSignedIn && clerkUser) {
      const uid = clerkUser.id;
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const displayName = clerkUser.fullName ?? clerkUser.username ?? 'User';

      // Fetch or create the Firestore user profile (best-effort — navigation
      // is driven by Clerk's isSignedIn, not this Firestore round-trip)
      (async () => {
        try {
          setLoading(true);
          const profile = await getUserProfile(uid);
          if (profile) {
            setUser(profile);
          } else {
            // First sign-in — bootstrap Firestore profile from Clerk identity
            const created = await createUserProfileIfMissing(uid, displayName, email);
            setUser(created);
          }
        } catch (error) {
          console.error('[AuthContext] Error loading user profile:', error);
          // Don't set user=null here — the user IS signed in via Clerk.
          // Just mark loading done so the app doesn't spin forever.
          setLoading(false);
        }
      })();
    } else {
      // Signed out
      logout();
    }
  }, [isSignedIn, isLoaded, clerkUser, setUser, setLoading, logout]);

  return (
    <AuthContext.Provider value={{ isReady: isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
