import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { auth } from './firebase';

export type CurrentUser = {
  id: string;
  email?: string;
  emailVerified: boolean;
  isAdmin: boolean;
  displayName: string;
  tenant: {
    id: string;
    name: string;
    type: 'personal';
    role: 'owner';
  };
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  retryProfile: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(): string {
  return 'We could not verify your Safar account. Please try signing in again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      void firebaseUser
        .getIdToken(true)
        .then(async (idToken) => {
          const response = await fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${idToken}`, Accept: 'application/json' },
          });
          if (!response.ok) throw new Error('Profile request failed');
          const currentUser = (await response.json()) as CurrentUser;
          if (!cancelled) setUser(currentUser);
        })
        .catch(() => {
          if (!cancelled) {
            setUser(null);
            setError(friendlyAuthError());
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [retryCount]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signIn: async () => {
        setError(null);
        try {
          await signInAnonymously(auth);
        } catch {
          setError('Safar could not start sign-in. Check the local Firebase Auth Emulator and try again.');
          setLoading(false);
        }
      },
      signInWithEmail: async (email, password) => {
        setError(null);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (authError) {
          setError(authError instanceof Error ? authError.message : friendlyAuthError());
        }
      },
      createAccount: async (email, password) => {
        setError(null);
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(credential.user);
        } catch (authError) {
          setError(authError instanceof Error ? authError.message : friendlyAuthError());
        }
      },
      sendVerificationEmail: async () => {
        setError(null);
        try {
          if (!auth.currentUser) throw new Error('Sign in before requesting a verification email.');
          await sendEmailVerification(auth.currentUser);
        } catch (authError) {
          setError(authError instanceof Error ? authError.message : friendlyAuthError());
        }
      },
      signOut: async () => {
        try {
          await firebaseSignOut(auth);
        } catch {
          setError('Safar could not sign out. Please try again.');
        }
      },
      retryProfile: () => setRetryCount((count) => count + 1),
    }),
    [error, loading, user],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
