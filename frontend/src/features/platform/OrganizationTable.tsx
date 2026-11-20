import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlatformOrganization } from '../../types';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Building2, ShieldAlert, ShieldCheck, UserCheck, RefreshCw, Eye, User } from 'lucide-react';

// =============================================================================
// Platform Organizations Table
// Data grid presenting tenant organizations, status badges, and governance actions
// =============================================================================

export interface OrganizationTableProps {
  organizations: PlatformOrganization[];
  isLoading: boolean;
  onToggleStatus: (org: PlatformOrganization) => void;
  onAssignAdmin: (org: PlatformOrganization) => void;
  onViewDetails?: (org: PlatformOrganization) => void;
}

export const OrganizationTable: React.FC<OrganizationTableProps> = ({
  organizations,
  isLoading,
  onToggleStatus,
  onAssignAdmin,
  onViewDetails,
}) => {
  const navigate = useNavigate();

  // Step 1: Handle navigation to organization details page
  const handleViewDetails = (org: PlatformOrganization) => {
    console.log(`[OrganizationTable] Step 1: Navigating to details for org: ${org.id}`);
    if (onViewDetails) {
      onViewDetails(org);
    } else {
      navigate(`/platform-admin/organizations/${org.id}`);
    }
  };

  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50/75 border-b border-surface-200 text-[11px] font-semibold text-surface-600 uppercase tracking-wider">
              <th className="py-3 px-4">Organization</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Initial Administrator</th>
              <th className="py-3 px-4">Members</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-surface-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                  Loading platform organizations...
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-surface-500">
                  No organizations found matching your search criteria.
                </td>
              </tr>
            ) : (
              organizations.map((org) => {
                const isActive = org.status === 'ACTIVE';
                const admin = org.initialAdmin || org.admin;

                return (
                  <tr key={org.id} className="hover:bg-surface-50/50 transition-colors">
                    {/* Organization details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-700 font-semibold shadow-2xs">
                          <Building2 className="w-4 h-4 text-surface-500" />
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(org)}
                            className="font-semibold text-surface-900 hover:text-brand-600 text-left block truncate transition-colors"
                          >
                            {org.name}
                          </button>
                          <span className="text-surface-500 text-[11px] font-mono block truncate">
                            /{org.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Initial Administrator */}
                    <td className="py-3.5 px-4">
                      {admin ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 flex-shrink-0">
                            <User className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-surface-900 block truncate">
                              {admin.fullName || 'Administrator'}
                            </span>
                            <span className="text-surface-500 text-[11px] block truncate">
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-surface-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Member Count */}
                    <td className="py-3.5 px-4">
                      <Badge variant="default" className="text-[11px] font-mono">
                        {org.memberCount ?? 0} members
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-surface-500 font-mono text-[11px]">
                      {new Date(org.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Governance Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(org)}
                          title="View organization details"
                          className="text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAssignAdmin(org)}
                          title="Assign or reassign organization admin"
                          className="text-xs text-surface-700 hover:text-surface-900"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-surface-500" />
                          Admin
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus(org)}
                          title={isActive ? 'Suspend organization' : 'Activate organization'}
                          className={
                            isActive
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }
                        >
                          {isActive ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
