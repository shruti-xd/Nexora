import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { AuthContextType, UserProfile, Organization, Membership, RoleName, RegisterFormData } from '../types';

// =============================================================================
// Auth Context & Provider
// Coordinates Supabase authentication session with backend CRM profile state
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Step 1: Synchronize backend profile and organization state using the current Supabase token
  const refreshProfile = useCallback(async () => {
    try {
      console.log('[AuthContext] Step 1: Refreshing user context from backend...');
      const me = await authService.getMe();
      console.log(`[AuthContext] Step 1: User context synchronized for ${me.user.email} (Role: ${me.membership.role})`);
      setUser(me.user);
      setOrganization(me.organization);
      setMembership(me.membership);
      setRole(me.membership.role);
      setPermissions(me.permissions);
    } catch (err: unknown) {
      console.warn('[AuthContext] Failed to fetch CRM profile from backend:', err);
      setUser(null);
      setOrganization(null);
      setMembership(null);
      setRole(null);
      setPermissions([]);
    }
  }, []);

  // Step 2: Initialize Supabase Auth session listener
  useEffect(() => {
    console.log('[AuthContext] Step 2: Initializing authentication session listener...');
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session && isMounted) {
          console.log('[AuthContext] Existing active session found. Synchronizing profile...');
          await refreshProfile();
        } else if (isMounted) {
          console.log('[AuthContext] No active session found.');
        }
      } catch (err) {
        console.error('[AuthContext] Error retrieving session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Step 2: Supabase Auth event detected: ${event}`);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          await refreshProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out. Resetting local state.');
        setUser(null);
        setOrganization(null);
        setMembership(null);
        setRole(null);
        setPermissions([]);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // Step 3: Login method integrating Supabase Auth password authentication
  const login = async (email: string, password: string): Promise<void> => {
    console.log(`[AuthContext] Step 3: Logging in with email: ${email}`);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.warn(`[AuthContext] Login failed: ${error.message}`);
        throw error;
      }

      console.log('[AuthContext] Step 3: Supabase signInWithPassword succeeded. Synchronizing profile...');
      if (data.session) {
        await refreshProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Register method calling backend atomic provisioning endpoint
  const register = async (data: RegisterFormData): Promise<void> => {
    console.log(`[AuthContext] Step 4: Submitting registration for email: ${data.email}`);
    setIsLoading(true);

    try {
      const response = await authService.register(data);
      console.log('[AuthContext] Step 4: Backend registration succeeded:', response);

      // If backend returned session tokens, initialize Supabase session
      if (response.session) {
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        });
      } else {
        // Fallback login
        await supabase.auth.signInWithPassword({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });
      }

      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Logout method ensuring clean local and server state termination
  const logout = async (): Promise<void> => {
    console.log('[AuthContext] Step 5: Terminating authentication session...');
    setIsLoading(true);

    try {
      // Notify backend for audit log
      await authService.logout();
    } catch (e) {
      console.warn('[AuthContext] Backend logout notice failed (continuing client sign-out):', e);
    } finally {
      // Sign out from Supabase Auth
      await supabase.auth.signOut();
      setUser(null);
      setOrganization(null);
      setMembership(null);
      setRole(null);
      setPermissions([]);
      setIsLoading(false);
      console.log('[AuthContext] Step 5: Logout sequence completed.');
    }
  };

  const value: AuthContextType = {
    user,
    organization,
    membership,
    role,
    permissions,
    isLoading,
    isAuthenticated: !!user && !!membership?.isActive,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for accessing Auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
