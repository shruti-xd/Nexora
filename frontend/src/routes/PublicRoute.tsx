import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// =============================================================================
// Public Route Guard
// Redirects authenticated users away from login/public screens to their origin or dashboard
// =============================================================================

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    console.log(`[PublicRoute] User already authenticated. Redirecting to: ${from}`);
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
