import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { platformService } from '../services/platformService';
import { PlatformOrganization, PlatformAdminUser } from '../types';
import { EditOrganizationModal } from '../features/platform/EditOrganizationModal';
import { OrganizationStatusModal } from '../features/platform/OrganizationStatusModal';
import { AssignAdminModal } from '../features/platform/AssignAdminModal';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  UserCheck,
  Edit3,
  Calendar,
  Users,
  Copy,
  Check,
  RefreshCw,
  Mail,
  User,
  KeyRound,
} from 'lucide-react';

// =============================================================================
// Platform Organization Detail Page
// Deep inspection and administration of a specific customer tenant workspace
// =============================================================================

export const PlatformOrgDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<PlatformOrganization | null>(null);
  const [administrators, setAdministrators] = useState<PlatformAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState<boolean>(false);

  // Step 1: Fetch organization details from backend platform API
  const loadOrganizationDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[PlatformOrgDetailPage] Step 1: Loading organization details for ID: ${id}`);

      const data = await platformService.getOrganization(id);
      console.log('[PlatformOrgDetailPage] Step 1 completed: Received data:', data);

      setOrg(data.organization);
      setAdministrators(data.administrators || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve organization details.';
      console.error('[PlatformOrgDetailPage] Error loading organization:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrganizationDetails();
  }, [loadOrganizationDetails]);

  // Step 2: Handle copy organization ID to clipboard
  const handleCopyId = () => {
    if (org?.id) {
      navigator.clipboard.writeText(org.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Loading organization details...
        </p>
      </div>
    );
  }

  if (errorMessage || !org) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-12">
        <Alert variant="error" title="Organization Not Found">
          {errorMessage || 'The requested organization could not be located on the platform.'}
        </Alert>
        <Button variant="outline" onClick={() => navigate('/platform-admin/organizations')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Organizations
        </Button>
      </div>
    );
  }

  const isActive = org.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-surface-500">
        <Link
          to="/platform-admin/organizations"
          className="hover:text-surface-800 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Organizations</span>
        </Link>
        <span>/</span>
        <span className="text-surface-800 font-medium truncate max-w-xs">{org.name}</span>
      </div>

      {/* Step 3: Organization Hero Header */}
      <div className="bg-white p-6 border border-surface-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-surface-900">{org.name}</h1>
              {isActive ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Suspended
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 mt-1">
              <span className="font-mono bg-surface-100 px-2 py-0.5 rounded">
                /{org.slug}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                ID: {org.id.substring(0, 8)}...
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="hover:text-surface-900 text-surface-400"
                  title="Copy full UUID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="text-xs"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1 text-surface-600" />
            Edit Info
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignAdminOpen(true)}
            className="text-xs"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Assign Admin
          </Button>

          <Button
            size="sm"
            onClick={() => setIsStatusOpen(true)}
            className={`text-xs ${
              isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Suspend Workspace
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Activate Workspace
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step 4: Detail Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Administrators & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Organization Administrators */}
          <div className="bg-white border border-surface-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-surface-900">Organization Administrators</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignAdminOpen(true)}
                className="text-xs"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Add Admin
              </Button>
            </div>

            <div className="divide-y divide-surface-100 text-xs">
              {administrators.length === 0 ? (
                <div className="p-6 text-center text-surface-500">
                  No active administrators assigned to this organization.
                </div>
              ) : (
                administrators.map((admin) => (
                  <div key={admin.userId} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900">{admin.fullName || 'Administrator'}</p>
                        <p className="text-[11px] text-surface-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-surface-400" />
                          {admin.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" className="text-[10px]">
                        ADMIN
                      </Badge>
                      {admin.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Multi-Tenant Architecture & Data Isolation */}
          <div className="bg-white p-5 border border-surface-200 rounded-xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tenant Isolation & RBAC Governance
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Nexora enforces strict organization-level data boundaries. All CRM records (Leads, Accounts, Contacts, Opportunities, Activities, and Members) are bounded to{' '}
              <code className="text-purple-700 font-mono text-[11px] bg-purple-50 px-1 py-0.5 rounded">
                organization_id = {org.id}
              </code>
              . Cross-tenant access is rejected at both the Supabase Row-Level Security (RLS) layer and the Express RBAC middleware layer.
            </p>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Quick Facts */}
        <div className="space-y-6">
          <Card className="border-surface-200 bg-white shadow-xs">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                Workspace Metadata
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-surface-400 block text-[11px]">Total Members</span>
                  <span className="font-semibold text-surface-900 text-sm">
                    {org.memberCount ?? 0} active members
                  </span>
                </div>

                <div>
                  <span className="text-surface-400 block text-[11px]">Created Date</span>
                  <span className="text-surface-700 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-surface-400" />
                    {new Date(org.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-surface-400 block text-[11px]">Last Updated</span>
                  <span className="text-surface-700 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-surface-400" />
                    {new Date(org.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-surface-400 block text-[11px]">Platform Scope</span>
                  <span className="text-surface-800 font-medium mt-0.5 block">
                    Enterprise SaaS Multi-Tenant
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Step 5: Modals */}
      <EditOrganizationModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        org={org}
        onSuccess={loadOrganizationDetails}
      />

      <OrganizationStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        org={org}
        onSuccess={loadOrganizationDetails}
      />

      <AssignAdminModal
        isOpen={isAssignAdminOpen}
        onClose={() => setIsAssignAdminOpen(false)}
        org={org}
        onSuccess={loadOrganizationDetails}
      />
    </div>
  );
};
