import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformService } from '../services/platformService';
import { PlatformOrganization, PaginationMeta } from '../types';
import { OrganizationTable } from '../features/platform/OrganizationTable';
import { CreateOrganizationModal } from '../features/platform/CreateOrganizationModal';
import { OrganizationStatusModal } from '../features/platform/OrganizationStatusModal';
import { AssignAdminModal } from '../features/platform/AssignAdminModal';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

// =============================================================================
// Platform Organizations Page
// Central workspace for Platform Administrators to manage tenant organizations
// =============================================================================

export const PlatformOrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusOrg, setStatusOrg] = useState<PlatformOrganization | null>(null);
  const [assignAdminOrg, setAssignAdminOrg] = useState<PlatformOrganization | null>(null);

  // Step 1: Load organizations from backend platform API
  const loadOrganizations = useCallback(
    async (page: number, search?: string, status?: string) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        console.log(
          `[PlatformOrganizationsPage] Step 1: Querying platform organizations (Page=${page}, Search="${search || ''}", Status="${status || 'ALL'}")`
        );

        const data = await platformService.listOrganizations(page, 10, search, status);

        console.log(
          `[PlatformOrganizationsPage] Step 1: Loaded ${data.organizations.length} organizations (Total: ${data.pagination.totalItems})`
        );
        setOrganizations(data.organizations);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load platform organizations.';
        console.error('[PlatformOrganizationsPage] Error loading organizations:', msg);
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrganizations(pagination.page, searchTerm, statusFilter);
  }, [loadOrganizations, pagination.page, statusFilter]);

  // Step 2: Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[PlatformOrganizationsPage] Step 2: Searching organizations: "${searchTerm}"`);
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadOrganizations(1, searchTerm, statusFilter);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Platform Console
            </span>
          </div>
          <h2 className="text-xl font-bold text-surface-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Tenant Organizations
          </h2>
          <p className="text-xs text-surface-500 mt-1">
            Provision new CRM organizations, suspend or activate customer tenants, and assign primary administrators.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Quick Modal
          </Button>
          <Button
            onClick={() => navigate('/platform-admin/organizations/new')}
            className="shadow-xs text-xs bg-purple-600 hover:bg-purple-700 text-white"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 border border-surface-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by organization name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-xs"
            />
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-surface-600">
            <Filter className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadOrganizations(pagination.page, searchTerm, statusFilter)}
          disabled={isLoading}
          title="Refresh list"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {successNotice && (
        <Alert variant="success" title="Success">
          {successNotice}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Error Loading Organizations">
          {errorMessage}
        </Alert>
      )}

      {/* Organizations Table */}
      <OrganizationTable
        organizations={organizations}
        isLoading={isLoading}
        onToggleStatus={(org) => setStatusOrg(org)}
        onAssignAdmin={(org) => setAssignAdminOrg(org)}
        onViewDetails={(org) => navigate(`/platform-admin/organizations/${org.id}`)}
      />

      {/* Pagination Controls */}
      <div className="bg-white p-4 border border-surface-200 rounded-xl shadow-xs flex items-center justify-between">
        <p className="text-xs text-surface-500">
          Showing <strong className="text-surface-700">{organizations.length}</strong> of{' '}
          <strong className="text-surface-700">{pagination.totalItems}</strong> organizations
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page <= 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-xs text-surface-600 px-2 font-medium">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dialog Modals */}
      <CreateOrganizationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setSuccessNotice('Organization created and administrator invited successfully!');
          setTimeout(() => setSuccessNotice(null), 5000);
          loadOrganizations(1, searchTerm, statusFilter);
        }}
      />

      <OrganizationStatusModal
        isOpen={!!statusOrg}
        onClose={() => setStatusOrg(null)}
        org={statusOrg}
        onSuccess={() => {
          setSuccessNotice('Organization status updated successfully!');
          setTimeout(() => setSuccessNotice(null), 5000);
          loadOrganizations(pagination.page, searchTerm, statusFilter);
        }}
      />

      <AssignAdminModal
        isOpen={!!assignAdminOrg}
        onClose={() => setAssignAdminOrg(null)}
        org={assignAdminOrg}
        onSuccess={() => {
          setSuccessNotice('Organization administrator assigned successfully!');
          setTimeout(() => setSuccessNotice(null), 5000);
          loadOrganizations(pagination.page, searchTerm, statusFilter);
        }}
      />
    </div>
  );
};
