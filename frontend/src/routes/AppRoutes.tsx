import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { PlatformAdminLayout } from '../layouts/PlatformAdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { PlatformRoute } from './PlatformRoute';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardPlaceholderPage } from '../pages/DashboardPlaceholderPage';
import { UsersPage } from '../pages/UsersPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PlatformOverviewPage } from '../pages/PlatformOverviewPage';
import { PlatformOrganizationsPage } from '../pages/PlatformOrganizationsPage';
import { PlatformCreateOrgPage } from '../pages/PlatformCreateOrgPage';
import { PlatformOrgDetailPage } from '../pages/PlatformOrgDetailPage';
import { LeadsPage } from '../pages/LeadsPage';
import { LeadDetailPage } from '../pages/LeadDetailPage';
import { AccountsPage } from '../pages/AccountsPage';
import { AccountDetailPage } from '../pages/AccountDetailPage';
import { ContactsPage } from '../pages/ContactsPage';
import { ContactDetailPage } from '../pages/ContactDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// =============================================================================
// Application Routes
// Top-level route declarations connecting layouts, guards, and domain pages
// =============================================================================

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Step 1: Public Authentication Routes (Salesforce-style, registration removed) */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Step 2: Protected CRM Workspace Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPlaceholderPage />} />

        {/* Step 2.1: Module 02 - Leads, Accounts & Contacts */}
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/:id" element={<AccountDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />

        {/* Step 2.2: Team Members & Settings */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Step 3: Platform Administrator Exclusive Area (/platform-admin) */}
      <Route
        path="/platform-admin"
        element={
          <PlatformRoute>
            <PlatformAdminLayout />
          </PlatformRoute>
        }
      >
        {/* Step 3.1: Overview Dashboard */}
        <Route index element={<PlatformOverviewPage />} />
        <Route path="overview" element={<Navigate to="/platform-admin" replace />} />

        {/* Step 3.2: Organizations Listing */}
        <Route path="organizations" element={<PlatformOrganizationsPage />} />

        {/* Step 3.3: Create Organization */}
        <Route path="organizations/new" element={<PlatformCreateOrgPage />} />

        {/* Step 3.4: Organization Details */}
        <Route path="organizations/:id" element={<PlatformOrgDetailPage />} />
      </Route>

      {/* Step 3.5: Legacy /platform redirection aliases */}
      <Route path="/platform" element={<Navigate to="/platform-admin" replace />} />
      <Route path="/platform/organizations" element={<Navigate to="/platform-admin/organizations" replace />} />
      <Route path="/platform/organizations/*" element={<Navigate to="/platform-admin/organizations" replace />} />

      {/* Step 4: Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
