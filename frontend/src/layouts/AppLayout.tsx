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
} from 'lucide-react';
import { cn } from '../utils/cn';

// =============================================================================
// App Layout Component
// Reusable application shell containing Sidebar, Topbar, and Route Outlet
// =============================================================================

export const AppLayout: React.FC = () => {
  const { user, organization, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Step 1: Define navigation items
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
      disabled: true,
      badge: 'Module 02',
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
      disabled: true,
      badge: 'Upcoming',
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
    console.log('[AppLayout] User initiated sign out from dropdown');
    await logout();
    navigate('/login');
  };

  // Step 3: Determine page title based on current path
  const getPageTitle = () => {
    if (location.pathname.startsWith('/users')) return 'Team Members';
    if (location.pathname.startsWith('/accounts')) return 'Accounts';
    if (location.pathname.startsWith('/settings')) return 'Workspace Settings';
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    return 'CRM Platform';
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
              <span className="font-bold text-base text-surface-900 block leading-tight">Apex CRM</span>
              <span className="text-[10px] font-semibold text-brand-600 tracking-wider uppercase block">Module 01</span>
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
                {organization?.name || 'Workspace'}
              </p>
              <p className="text-[10px] text-surface-500 truncate">/{organization?.slug || 'crm'}</p>
            </div>
            <Badge variant="purple" className="text-[10px] px-1.5 py-0">
              {role || 'USER'}
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-surface-100">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-surface-900 truncate">{user?.fullName}</p>
              <p className="text-[11px] text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-surface-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-surface-600 hover:text-surface-900 p-1 rounded-lg hover:bg-surface-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-surface-900 tracking-tight">{getPageTitle()}</h1>
          </div>

          {/* Search, Notifications & User Profile Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Placeholder Input */}
            <div className="hidden sm:flex items-center relative w-64">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search CRM..."
                disabled
                className="w-full pl-9 pr-3 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-xs text-surface-600 cursor-not-allowed opacity-75 placeholder:text-surface-400 focus:outline-none"
              />
            </div>

            {/* Notification Bell Placeholder */}
            <button
              disabled
              title="Notifications (Upcoming)"
              className="p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100 relative cursor-not-allowed opacity-70"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* User Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl} size="sm" />
                <span className="hidden md:inline-block text-xs font-semibold text-surface-800">
                  {user?.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
              </button>

              {/* Dropdown Popover */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-200 py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-surface-100">
                      <p className="text-xs font-semibold text-surface-900">{user?.fullName}</p>
                      <p className="text-[11px] text-surface-500 truncate">{user?.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge variant="info" className="text-[10px] px-1.5 py-0">
                          {role}
                        </Badge>
                      </div>
                    </div>

                    <NavLink
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-surface-700 hover:bg-surface-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-surface-400" />
                      Workspace Settings
                    </NavLink>

                    <div className="border-t border-surface-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
