import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ShieldCheck,
  Building2,
  LayoutDashboard,
  PlusCircle,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Server,
} from 'lucide-react';
import { cn } from '../utils/cn';

// =============================================================================
// Platform Admin Layout
// Dedicated, secure layout for Nexora Platform Administrators
// =============================================================================

export const PlatformAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Step 1: Define navigation items for Platform Console
  const navItems = [
    {
      name: 'Overview',
      to: '/platform-admin',
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: 'Organizations',
      to: '/platform-admin/organizations',
      icon: Building2,
      end: false,
    },
    {
      name: 'Create Organization',
      to: '/platform-admin/organizations/new',
      icon: PlusCircle,
      end: true,
    },
  ];

  // Step 2: Handle sign out
  const handleLogout = async () => {
    console.log('[PlatformAdminLayout] Step 2: Platform Admin sign out triggered');
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-200 transition-transform duration-200 ease-in-out md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white block leading-tight">Nexora</span>
              <span className="text-[10px] font-semibold text-purple-400 tracking-wider uppercase block">
                Platform Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Security Badge */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-purple-900/50 bg-purple-950/30">
            <Server className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Global Multi-Tenant Hub</p>
              <p className="text-[10px] text-slate-400 truncate">System Governance</p>
            </div>
            <Badge variant="purple" className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-300 border-purple-800">
              ROOT
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Governance Console
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors select-none',
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Switch to CRM Workspace & User Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/20">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to CRM Workspace</span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user?.email || 'Platform Admin'} size="sm" className="bg-purple-700 text-white" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {user?.fullName || 'Platform Admin'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-surface-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-surface-500 hover:text-surface-700 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-surface-800 text-sm sm:text-base">
                Platform Administration Console
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Superuser Access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform-admin/organizations/new')}
              className="text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1 text-purple-600" />
              New Organization
            </Button>
          </div>
        </header>

        {/* Child Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
