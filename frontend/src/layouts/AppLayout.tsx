import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  LayoutDashboard,
  Users2,
  Building2,
  UserSquare2,
  TrendingUp,
  CalendarCheck,
  Settings,
  ShieldCheck,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Building,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { cn } from '../utils/cn';

// =============================================================================
// App Layout Component
// Reusable application shell containing Sidebar, Topbar, and Route Outlet
// =============================================================================

export const AppLayout: React.FC = () => {
  const { user, organization, role, isPlatformAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Step 1: Define navigation items for standard CRM workspace
  const navItems = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      isPlaceholder: true,
      badge: 'Preview',
    },
    {
      name: 'Leads',
      to: '/leads',
      icon: Users2,
      isAvailable: true,
    },
    {
      name: 'Accounts',
      to: '/accounts',
      icon: Building2,
      isAvailable: true,
    },
    {
      name: 'Contacts',
      to: '/contacts',
      icon: UserSquare2,
      isAvailable: true,
    },
    {
      name: 'Opportunities',
      to: '/opportunities',
      icon: TrendingUp,
      disabled: true,
      badge: 'Upcoming',
    },
    {
      name: 'Activities',
      to: '/activities',
      icon: CalendarCheck,
      disabled: true,
      badge: 'Upcoming',
    },
    {
      name: 'Team Members',
      to: '/users',
      icon: Users2,
      isAvailable: true,
    },
    {
      name: 'Settings',
      to: '/settings',
      icon: Settings,
      isAvailable: true,
    },
  ];

  // Step 2: Handle sign out
  const handleLogout = async () => {
    console.log('[AppLayout] Step 2: User initiated sign out sequence');
    await logout();
    navigate('/login');
  };

  // Step 3: Determine page title based on current path
  const getPageTitle = () => {
    if (location.pathname.startsWith('/platform/organizations')) return 'Platform Organizations';
    if (location.pathname.startsWith('/users')) return 'Team Members';
    if (location.pathname.startsWith('/settings')) return 'Workspace Settings';
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    return 'Nexora CRM';
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-6 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-surface-900 block leading-tight">Nexora CRM</span>
              <span className="text-[10px] font-semibold text-brand-600 tracking-wider uppercase block">
                {isPlatformAdmin ? 'Platform Edition' : 'Enterprise'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-surface-400 hover:text-surface-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Workspace Pill */}
        <div className="p-4 border-b border-surface-100 bg-surface-50/50">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-surface-200 bg-white shadow-xs">
            <Building className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-surface-900 truncate">
                {organization?.name || (isPlatformAdmin ? 'Platform Console' : 'Workspace')}
              </p>
              <p className="text-[10px] text-surface-500 truncate">
                {organization?.slug ? `/${organization.slug}` : (isPlatformAdmin ? '/platform' : '/crm')}
              </p>
            </div>
            <Badge variant={isPlatformAdmin ? 'purple' : 'default'} className="text-[10px] px-1.5 py-0">
              {isPlatformAdmin ? 'PLATFORM' : role || 'USER'}
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Platform Administration Section (Only for Platform Admins) */}
          {isPlatformAdmin && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                Platform Admin
              </p>
              <NavLink
                to="/platform/organizations"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors select-none',
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-brand-600" />
                  <span>Organizations</span>
                </div>
                <Badge variant="purple" className="text-[10px] px-1.5 py-0 font-mono">
                  Console
                </Badge>
              </NavLink>
            </div>
          )}

          {/* CRM Workspace Modules */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-surface-400 uppercase tracking-wider">
              CRM Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-surface-400 cursor-not-allowed select-none opacity-60"
                    title="Coming soon in subsequent CRM modules"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-surface-400" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-surface-100 text-surface-500 px-1.5 py-0.5 rounded font-mono font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors select-none',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-surface-500" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-mono font-medium">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-surface-200">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors">
            <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-surface-900 truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] text-surface-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-surface-400 hover:text-red-600 transition-colors p-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-surface-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-surface-500 hover:text-surface-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-surface-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search Bar Placeholder */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Quick search... (Press /)"
                disabled
                className="pl-9 pr-4 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-xs text-surface-500 placeholder:text-surface-400 w-60 cursor-not-allowed opacity-75"
              />
            </div>

            {/* Notification Bell */}
            <button
              className="relative p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-50 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-brand-600 absolute top-2 right-2 ring-2 ring-white" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-50 transition-colors"
              >
                <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl} size="sm" />
                <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-surface-200 py-1.5 z-40">
                    <div className="px-3.5 py-2 border-b border-surface-100">
                      <p className="text-xs font-semibold text-surface-900 truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-[11px] text-surface-500 truncate">{user?.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                          {isPlatformAdmin ? 'PLATFORM ADMIN' : role || 'USER'}
                        </Badge>
                      </div>
                    </div>

                    {isPlatformAdmin && (
                      <NavLink
                        to="/platform/organizations"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-surface-700 hover:bg-surface-50 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-brand-600" />
                        Platform Console
                      </NavLink>
                    )}

                    <NavLink
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-surface-700 hover:bg-surface-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-surface-400" />
                      Workspace Settings
                    </NavLink>

                    <div className="border-t border-surface-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
