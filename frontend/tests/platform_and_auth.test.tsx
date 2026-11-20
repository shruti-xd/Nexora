import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OrganizationTable } from '../src/features/platform/OrganizationTable';
import { LoginForm } from '../src/features/auth/LoginForm';
import { InviteUserModal } from '../src/features/users/InviteUserModal';
import { PlatformOrganization } from '../src/types';

// Mock the AuthContext for LoginForm test
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    organization: null,
    membership: null,
    role: null,
    permissions: [],
    isLoading: false,
    isAuthenticated: false,
    isPlatformAdmin: false,
    refreshProfile: vi.fn(),
  }),
}));

describe('Platform Administration & Auth Architecture Tests', () => {
  it('Step 1: OrganizationTable renders organizations with status badges and action buttons', () => {
    console.log('[Test] Step 1: Testing OrganizationTable rendering');

    const mockOrgs: PlatformOrganization[] = [
      {
        id: 'org-1',
        name: 'Acme Global',
        slug: 'acme-global',
        status: 'ACTIVE',
        memberCount: 5,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'org-2',
        name: 'Stark Industries',
        slug: 'stark-industries',
        status: 'SUSPENDED',
        memberCount: 2,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ];

    const onToggleStatus = vi.fn();
    const onAssignAdmin = vi.fn();

    render(
      <BrowserRouter>
        <OrganizationTable
          organizations={mockOrgs}
          isLoading={false}
          onToggleStatus={onToggleStatus}
          onAssignAdmin={onAssignAdmin}
        />
      </BrowserRouter>
    );

    // Assert organization details are present
    expect(screen.getByText('Acme Global')).toBeInTheDocument();
    expect(screen.getByText('/acme-global')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5 members')).toBeInTheDocument();

    expect(screen.getByText('Stark Industries')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(screen.getByText('2 members')).toBeInTheDocument();

    // Assert action buttons
    expect(screen.getByRole('button', { name: /suspend/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activate/i })).toBeInTheDocument();
  });

  it('Step 2: LoginForm does NOT render public workspace registration links', () => {
    console.log('[Test] Step 2: Testing LoginForm absence of self-service registration');

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Assert login elements exist
    expect(screen.getByText(/sign in to nexora crm/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Assert public registration link is removed
    expect(screen.queryByText(/register workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create account & workspace/i)).not.toBeInTheDocument();

    // Assert organization-controlled access message is rendered
    expect(
      screen.getByText(/organization-controlled access/i)
    ).toBeInTheDocument();
  });

  it('Step 3: InviteUserModal renders full name, email, and role selector for Org Admins', () => {
    console.log('[Test] Step 3: Testing InviteUserModal form fields');

    render(
      <InviteUserModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/invite team member/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assigned role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send invitation/i })).toBeInTheDocument();
  });

  it('Step 4: PlatformCreateOrgPage renders organization and administrator provisioning form', async () => {
    console.log('[Test] Step 4: Testing PlatformCreateOrgPage form inputs and action button');
    const { PlatformCreateOrgPage } = await import('../src/pages/PlatformCreateOrgPage');

    render(
      <BrowserRouter>
        <PlatformCreateOrgPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/create new organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email address \*/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create organization & invite admin/i })).toBeInTheDocument();
  });
});
