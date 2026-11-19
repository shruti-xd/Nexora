import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/usersService';
import { OrganizationMember, PaginationMeta, RoleName } from '../../types';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { RoleChangeModal } from './RoleChangeModal';
import { StatusChangeModal } from './StatusChangeModal';
import { InviteUserModal } from './InviteUserModal';
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  UserPlus,
  Mail,
  Clock,
  Filter,
} from 'lucide-react';

// =============================================================================
// User List Component
// Organization member directory with role governance, status toggles, and invitations
// =============================================================================

export const UserList: React.FC = () => {
  const { user: currentUser, role: currentUserRole } = useAuth();
  const isAdmin = currentUserRole === 'ADMIN';

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Modal dialog states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [roleModalMember, setRoleModalMember] = useState<OrganizationMember | null>(null);
  const [statusModalMember, setStatusModalMember] = useState<OrganizationMember | null>(null);

  // Step 1: Query members from backend API with search, role, and status filters
  const fetchMembers = useCallback(
    async (page: number, search?: string, role?: string, status?: string) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        console.log(
          `[UserList] Step 1: Fetching members (Page=${page}, Search="${search || ''}", Role="${role || 'ALL'}", Status="${status || 'ALL'}")`
        );

        const data = await usersService.listMembers(page, 10, search, role, status);

        console.log(`[UserList] Step 1: Retrieved ${data.members.length} members (Total: ${data.pagination.totalItems})`);
        setMembers(data.members);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load organization members.';
        console.error('[UserList] Step 1: Error loading members:', msg);
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load and filter change trigger
  useEffect(() => {
    fetchMembers(pagination.page, searchTerm, roleFilter, statusFilter);
  }, [fetchMembers, pagination.page, roleFilter, statusFilter]);

  // Step 2: Handle search input submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[UserList] Step 2: Searching members for query: "${searchTerm}"`);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchMembers(1, searchTerm, roleFilter, statusFilter);
  };

  // Step 3: Handle resend invitation action
  const handleResendInvite = async (userId: string, email: string) => {
    try {
      setResendingId(userId);
      setSuccessNotice(null);
      setErrorMessage(null);
      console.log(`[UserList] Step 3: Resending invitation email to ${email}`);

      await usersService.resendInvitation(userId);

      console.log(`[UserList] Step 3: Invitation resent successfully to ${email}`);
      setSuccessNotice(`Invitation email successfully resent to ${email}`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend invitation.';
      console.error('[UserList] Step 3: Resend invitation failed:', msg);
      setErrorMessage(msg);
    } finally {
      setResendingId(null);
    }
  };

  // Step 4: Role badge variant mapper
  const getRoleBadgeVariant = (role: RoleName) => {
    switch (role) {
      case 'ADMIN':
        return 'purple';
      case 'MANAGER':
        return 'info';
      case 'SALES_REP':
        return 'success';
      case 'VIEWER':
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Organization Members
          </h2>
          <p className="text-xs text-surface-500 mt-1">
            Manage your workspace team members, role assignments, invitations, and access states.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setIsInviteModalOpen(true)} className="shadow-xs self-start sm:self-auto">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 border border-surface-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-xs"
            />
          </form>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-surface-600">
            <Filter className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SALES_REP">Sales Rep</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-2.5 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Invitation Pending</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMembers(pagination.page, searchTerm, roleFilter, statusFilter)}
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
        <Alert variant="error" title="Error Loading Members">
          {errorMessage}
        </Alert>
      )}

      {/* Members Table */}
      <div className="bg-white border border-surface-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/75 border-b border-surface-200 text-[11px] font-semibold text-surface-600 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Joined / Invited</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-surface-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading organization members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-surface-500">
                    No organization members found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isCurrent = member.userId === currentUser?.id;
                  const isPending = member.invitationStatus === 'PENDING';

                  return (
                    <tr key={member.membershipId} className="hover:bg-surface-50/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.fullName} src={member.avatarUrl} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-surface-900 truncate">
                                {member.fullName}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded font-medium border border-brand-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-surface-500 text-[11px] block truncate">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Invitation Pending
                          </span>
                        ) : member.isMemberActive ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-surface-400 text-[11px] font-medium">
                            <span className="w-2 h-2 rounded-full bg-surface-300" />
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Joined / Invited Date */}
                      <td className="py-3.5 px-4 text-surface-500 font-mono text-[11px]">
                        {new Date(member.invitedAt || member.joinedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(member.userId, member.email)}
                                disabled={resendingId === member.userId}
                                title="Resend invitation email"
                                className="text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                              >
                                <Mail className={`w-3.5 h-3.5 mr-1 ${resendingId === member.userId ? 'animate-spin' : ''}`} />
                                Resend Invite
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRoleModalMember(member)}
                              disabled={isCurrent}
                              title={isCurrent ? 'You cannot alter your own role' : 'Change role'}
                              className="text-xs"
                            >
                              <Shield className="w-3.5 h-3.5 text-surface-500" />
                              Role
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStatusModalMember(member)}
                              disabled={isCurrent && member.isMemberActive}
                              title={isCurrent ? 'You cannot deactivate yourself' : 'Toggle status'}
                              className={
                                member.isMemberActive
                                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }
                            >
                              {member.isMemberActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                              {member.isMemberActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-surface-200 flex items-center justify-between bg-surface-50/50">
          <p className="text-xs text-surface-500">
            Showing <strong className="text-surface-700">{members.length}</strong> of{' '}
            <strong className="text-surface-700">{pagination.totalItems}</strong> members
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
      </div>

      {/* Invite Member Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setSuccessNotice('Invitation sent successfully!');
          setTimeout(() => setSuccessNotice(null), 5000);
          fetchMembers(1, searchTerm, roleFilter, statusFilter);
        }}
      />

      {/* Role Change Modal Dialog */}
      <RoleChangeModal
        isOpen={!!roleModalMember}
        onClose={() => setRoleModalMember(null)}
        member={roleModalMember}
        currentUserId={currentUser?.id}
        onSuccess={() => fetchMembers(pagination.page, searchTerm, roleFilter, statusFilter)}
      />

      {/* Status Toggle Modal Dialog */}
      <StatusChangeModal
        isOpen={!!statusModalMember}
        onClose={() => setStatusModalMember(null)}
        member={statusModalMember}
        currentUserId={currentUser?.id}
        onSuccess={() => fetchMembers(pagination.page, searchTerm, roleFilter, statusFilter)}
      />
    </div>
  );
};
