import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { AuthContextType, UserProfile, Organization, Membership, RoleName } from '../types';

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
      console.log('[AuthContext] Step 1: Synchronizing authenticated user profile from backend...');
      const me = await authService.getMe();
      console.log(
        `[AuthContext] Step 1: Profile synchronized successfully for ${me.user.email} (Platform Admin: ${!!me.user.isPlatformAdmin}, Org: ${me.organization?.name || 'None'})`
      );
      setUser(me.user);
      setOrganization(me.organization);
      setMembership(me.membership);
      setRole(me.membership?.role || (me.user.isPlatformAdmin ? 'ADMIN' : null));
      setPermissions(me.permissions || []);
    } catch (err: unknown) {
      console.warn('[AuthContext] Step 1: Failed to fetch CRM profile from backend:', err);
      setUser(null);
      setOrganization(null);
      setMembership(null);
      setRole(null);
      setPermissions([]);
    }
  }, []);

  // Step 2: Initialize Supabase Auth session listener with proper async lifecycle
  useEffect(() => {
    console.log('[AuthContext] Step 2: Initializing authentication session listener...');
    let isMounted = true;

    // Listen to Supabase auth events (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Step 2.1: Supabase Auth event detected: ${event}`);

      try {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session && isMounted) {
            console.log(`[AuthContext] Step 2.2: Active session found for event ${event}. Synchronizing profile...`);
            await refreshProfile();
          } else if (isMounted) {
            console.log(`[AuthContext] Step 2.2: No active session found for event ${event}.`);
            setUser(null);
            setOrganization(null);
            setMembership(null);
            setRole(null);
            setPermissions([]);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] Step 2.3: User signed out. Resetting local auth state.');
          setUser(null);
          setOrganization(null);
          setMembership(null);
          setRole(null);
          setPermissions([]);
        }
      } catch (err) {
        console.error('[AuthContext] Step 2: Error processing auth state change:', err);
      } finally {
        if (isMounted) {
          console.log('[AuthContext] Step 2.4: Session sync complete. Setting isLoading to false.');
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // Step 3: Login method integrating Supabase Auth password authentication
  const login = async (email: string, password: string): Promise<void> => {
    console.log(`[AuthContext] Step 3: Initiating login for user: ${email}`);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.warn(`[AuthContext] Step 3: Supabase signInWithPassword rejected: ${error.message}`);
        throw error;
      }

      console.log('[AuthContext] Step 3: Supabase signIn succeeded. Refreshing user profile context...');
      if (data.session) {
        await refreshProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Logout method ensuring clean local and server state termination
  const logout = async (): Promise<void> => {
    console.log('[AuthContext] Step 4: Terminating authentication session...');
    setIsLoading(true);

    try {
      // Step 4.1: Notify backend for audit log
      await authService.logout();
    } catch (e) {
      console.warn('[AuthContext] Step 4.1: Backend logout audit failed (proceeding with local sign-out):', e);
    } finally {
      // Step 4.2: Sign out from Supabase Auth
      await supabase.auth.signOut();
      setUser(null);
      setOrganization(null);
      setMembership(null);
      setRole(null);
      setPermissions([]);
      setIsLoading(false);
      console.log('[AuthContext] Step 4: Logout sequence completed successfully.');
    }
  };

  // Platform Admin or active organization member is considered authenticated
  const isPlatformAdmin = !!user?.isPlatformAdmin;
  const isAuthenticated = !!user && (!!membership?.isActive || isPlatformAdmin);

  const value: AuthContextType = {
    user,
    organization,
    membership,
    role,
    permissions,
    isLoading,
    isAuthenticated,
    isPlatformAdmin,
    login,
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
