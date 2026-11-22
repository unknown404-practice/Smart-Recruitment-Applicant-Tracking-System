import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth } from '../config/firebaseClient';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  resetPassword as resetPasswordApi,
} from '../services/authService';
import { syncUserWithBackend, fetchCurrentUserProfile } from '../services/apiClient';

export interface DbUserProfile {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'HR' | 'CANDIDATE';
  company_id?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  dbUser: DbUserProfile | null;
  role: string;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string, role?: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string, role?: string) => Promise<void>;
  signInWithGoogle: (role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function inferRoleFromEmail(email?: string | null): string | null {
  if (!email) return null;
  const lower = email.toLowerCase();
  if (lower.startsWith('admin@') || lower.includes('admin')) return 'ADMIN';
  if (lower.startsWith('hr@') || lower.includes('hr lead') || lower.includes('recruiter')) return 'HR';
  return null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUserProfile | null>(null);
  const [tokenRole, setTokenRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // FE-05: Deduplication map for in-flight synchronization requests
  const syncInProgressRef = useRef<Map<string, Promise<DbUserProfile | null>>>(new Map());
  // Pending role ref to prevent onIdTokenChanged race condition during registration / login
  const pendingRoleRef = useRef<{ fullName?: string; role?: string } | null>(null);

  const syncProfile = async (
    firebaseUser: User,
    extraData?: { fullName?: string; role?: string }
  ): Promise<DbUserProfile | null> => {
    const effectiveRole = extraData?.role || pendingRoleRef.current?.role || undefined;
    const effectiveFullName = extraData?.fullName || pendingRoleRef.current?.fullName || firebaseUser.displayName || undefined;
    const syncKey = `${firebaseUser.uid}_${effectiveRole || ''}`;
    const existingSync = syncInProgressRef.current.get(syncKey);
    if (existingSync) {
      return existingSync;
    }

    const syncPromise = (async () => {
      try {
        const syncResult = await syncUserWithBackend({
          fullName: effectiveFullName,
          role: effectiveRole,
          avatarUrl: firebaseUser.photoURL || undefined,
        });

        // FE-01 (CRITICAL): Force token refresh to capture newly assigned custom claims
        try {
          await firebaseUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn('[AuthProvider] Forced token refresh warning:', tokenErr);
        }

        if (syncResult?.user) {
          setDbUser(syncResult.user);
          return syncResult.user;
        }
        return null;
      } catch (syncErr: any) {
        console.warn('[AuthProvider] Sync warning:', syncErr.message);
        // Attempt fallback fetch
        try {
          const fetched = await fetchCurrentUserProfile();
          if (fetched?.user) {
            setDbUser(fetched.user);
            return fetched.user;
          }
        } catch {
          // FE-06: Ensure synthetic fallback profile uses a valid UUID (not Firebase UID)
          const inferredRole = inferRoleFromEmail(firebaseUser.email);
          const resolvedFallbackRole = (effectiveRole as any) || tokenRole || inferredRole || 'CANDIDATE';
          const isStaff = ['HR', 'ADMIN', 'RECRUITER', 'SUPER_ADMIN'].includes(resolvedFallbackRole);
          const fallbackProfile: DbUserProfile = {
            id: '00000000-0000-0000-0000-000000000000',
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: effectiveFullName || (isStaff ? 'Staff User' : 'ATS User'),
            role: resolvedFallbackRole,
            company_id: isStaff ? 'a0000000-0000-0000-0000-000000000001' : null,
            avatar_url: firebaseUser.photoURL || null,
            is_active: true,
            created_at: new Date().toISOString(),
          };
          setDbUser(fallbackProfile);
          return fallbackProfile;
        }
        return null;
      } finally {
        syncInProgressRef.current.delete(syncKey);
        if (pendingRoleRef.current?.role === effectiveRole) {
          pendingRoleRef.current = null;
        }
      }
    })();

    syncInProgressRef.current.set(syncKey, syncPromise);
    return syncPromise;
  };

  useEffect(() => {
    // Listen to token refresh, revocation, and sign-in/out transitions (Floor 23)
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const tokenRes = await currentUser.getIdTokenResult();
          const claimRole = (tokenRes.claims.role as string) || null;
          if (claimRole) {
            setTokenRole(claimRole.toUpperCase());
          }
        } catch {
          // ignore token parse errors
        }
        await syncProfile(currentUser);
      } else {
        setDbUser(null);
        setTokenRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string, role?: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (role) {
        pendingRoleRef.current = { role };
      }
      const cred = await loginWithEmail(email, pass);
      await syncProfile(cred.user, role ? { role } : undefined);
    } catch (err: any) {
      pendingRoleRef.current = null;
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    fullName: string,
    role?: string
  ): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      pendingRoleRef.current = { fullName, role };
      const cred = await registerWithEmail(fullName, email, pass);
      await syncProfile(cred.user, { fullName, role });
    } catch (err: any) {
      pendingRoleRef.current = null;
      setError(err.message || 'Failed to register account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (role?: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (role) {
        pendingRoleRef.current = { role };
      }
      const cred = await loginWithGoogle();
      await syncProfile(cred.user, { role });
    } catch (err: any) {
      pendingRoleRef.current = null;
      setError(err.message || 'Google sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setDbUser(null);
      setTokenRole(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      await resetPasswordApi(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset');
      throw err;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (auth.currentUser) {
      await syncProfile(auth.currentUser);
    }
  };

  const role = dbUser?.role || tokenRole || inferRoleFromEmail(user?.email) || 'CANDIDATE';

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        role,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
