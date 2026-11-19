import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// =============================================================================
// Platform Route Guard
// Restricts route access exclusively to authenticated Platform Administrators
// =============================================================================

export const PlatformRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isPlatformAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Verifying Platform Privileges...
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Ensure user is signed in
  if (!isAuthenticated) {
    console.warn('[PlatformRoute] Step 1: Unauthenticated access attempt. Redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Step 2: Ensure user is a Platform Administrator
  if (!isPlatformAdmin) {
    console.warn('[PlatformRoute] Step 2: Unauthorized platform access attempt by non-platform admin. Redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[PlatformRoute] Step 3: Platform Administrator verified.');
  return <>{children}</>;
};
