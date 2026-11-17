import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

// =============================================================================
// Auth Layout
// Polished authentication layout for Registration, Login, and Password Recovery
// =============================================================================

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface-50 text-surface-900">
      {/* Top Header */}
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-surface-900 block leading-tight">Apex CRM</span>
            <span className="text-[11px] font-medium text-surface-500 block uppercase tracking-wider">Enterprise Platform</span>
          </div>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-surface-500 border-t border-surface-200/60">
        <p>&copy; {new Date().getFullYear()} Apex CRM Platform. Built with security and multi-tenancy at its core.</p>
      </footer>
    </div>
  );
};
