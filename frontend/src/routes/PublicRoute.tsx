import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// =============================================================================
// Public Route Guard
// Redirects authenticated users away from login/register screens to the dashboard
// =============================================================================

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    console.log('[PublicRoute] Already authenticated. Redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
