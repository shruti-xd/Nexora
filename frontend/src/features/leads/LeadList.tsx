import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { leadsService } from '../../services/leadsService';
import { Lead, LeadStatus, LeadRating, LeadSource, PaginationMeta } from '../../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import { LeadFormModal } from './LeadFormModal';
import { LeadConvertModal } from './LeadConvertModal';
import {
  Users2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';

// =============================================================================
// Lead List Component
// Organization Leads directory with status filters, rating indicators & conversion
// =============================================================================

export const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const canCreate = role !== 'VIEWER';

  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [conversionFilter, setConversionFilter] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Step 1: Fetch leads from backend
  const fetchLeads = useCallback(
    async (page: number, search?: string, status?: string, rating?: string, conv?: string) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        console.log(`[LeadList] Step 1: Fetching leads (Page=${page}, Search="${search || ''}", Status="${status || 'ALL'}")`);

        const isConvertedParam = conv === 'CONVERTED' ? true : conv === 'UNCONVERTED' ? false : undefined;

        const res = await leadsService.listLeads({
          page,
          limit: 10,
          search: search || undefined,
          status: status && status !== 'ALL' ? (status as LeadStatus) : undefined,
          rating: rating && rating !== 'ALL' ? (rating as LeadRating) : undefined,
          isConverted: isConvertedParam,
        });

        console.log(`[LeadList] Step 1: Retrieved ${res.leads.length} leads (Total: ${res.pagination.totalItems})`);
        setLeads(res.leads);
        setPagination(res.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch leads';
        console.error('[LeadList] Step 1 Failed:', msg);
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLeads(pagination.page, searchTerm, statusFilter, ratingFilter, conversionFilter);
  }, [fetchLeads, pagination.page, statusFilter, ratingFilter, conversionFilter]);

  // Step 2: Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[LeadList] Step 2: Searching leads: "${searchTerm}"`);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLeads(1, searchTerm, statusFilter, ratingFilter, conversionFilter);
  };

  // Step 3: Handle soft delete
  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete lead "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setErrorMessage(null);
      console.log(`[LeadList] Step 3: Deleting lead ID: ${id}`);
      await leadsService.deleteLead(id);
      setSuccessNotice(`Lead "${name}" was deleted successfully.`);
      fetchLeads(pagination.page, searchTerm, statusFilter, ratingFilter, conversionFilter);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lead';
      console.error('[LeadList] Step 3 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Render Badges
  const renderStatusBadge = (status: LeadStatus, isConverted: boolean) => {
    if (isConverted) {
      return (
        <Badge variant="success" className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Converted
        </Badge>
      );
    }

    switch (status) {
      case 'QUALIFIED':
        return <Badge variant="success">Qualified</Badge>;
      case 'CONTACTED':
        return <Badge variant="info">Contacted</Badge>;
      case 'NEW':
        return <Badge variant="default">New</Badge>;
      case 'UNQUALIFIED':
        return <Badge variant="default">Unqualified</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const renderRatingBadge = (rating: LeadRating) => {
    switch (rating) {
      case 'HOT':
        return <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Hot 🔥</span>;
      case 'WARM':
        return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Warm ⚡</span>;
      case 'COLD':
        return <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Cold ❄️</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-surface-900">Leads</h1>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            Qualify incoming opportunities, track ratings, and convert leads into accounts and contacts.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => {
              setEditingLead(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </Button>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      )}
      {successNotice && (
        <Alert variant="success">
          {successNotice}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
            <input
              type="text"
              placeholder="Search by name, company, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-sm rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-surface-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="UNQUALIFIED">Unqualified</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-sm rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-surface-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Ratings</option>
              <option value="HOT">Hot 🔥</option>
              <option value="WARM">Warm ⚡</option>
              <option value="COLD">Cold ❄️</option>
            </select>

            <select
              value={conversionFilter}
              onChange={(e) => {
                setConversionFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-sm rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-surface-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Leads</option>
              <option value="UNCONVERTED">Unconverted Only</option>
              <option value="CONVERTED">Converted Only</option>
            </select>

            <Button type="submit" variant="outline" className="px-3">
              Search
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setRatingFilter('ALL');
                setConversionFilter('ALL');
                fetchLeads(1, '', 'ALL', 'ALL', 'ALL');
              }}
              title="Reset Filters"
              className="p-2"
            >
              <RefreshCw className="w-4 h-4 text-surface-500" />
            </Button>
          </div>
        </form>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/75 border-b border-surface-200 text-xs font-semibold uppercase tracking-wider text-surface-500">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users2 className="w-10 h-10 mx-auto text-surface-300 mb-2" />
                    <p className="text-surface-700 font-medium">No leads found</p>
                    <p className="text-surface-400 text-xs mt-1">
                      {searchTerm || statusFilter !== 'ALL' || ratingFilter !== 'ALL'
                        ? 'Try adjusting your search filters.'
                        : 'Create your first lead to start building your sales pipeline.'}
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const isConverted = Boolean(l.convertedAt);
                  const fullName = [l.firstName, l.lastName].filter(Boolean).join(' ');

                  return (
                    <tr key={l.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-surface-900">
                        <button
                          onClick={() => navigate(`/leads/${l.id}`)}
                          className="text-left font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          {fullName}
                        </button>
                        {l.title && <p className="text-xs text-surface-400 mt-0.5">{l.title}</p>}
                      </td>
                      <td className="py-3 px-4 text-surface-700 font-medium flex items-center gap-1.5 pt-4">
                        <Building2 className="w-3.5 h-3.5 text-surface-400" />
                        {l.company}
                      </td>
                      <td className="py-3 px-4">{renderStatusBadge(l.status, isConverted)}</td>
                      <td className="py-3 px-4">{renderRatingBadge(l.rating)}</td>
                      <td className="py-3 px-4 text-xs text-surface-500">{l.source}</td>
                      <td className="py-3 px-4 text-xs text-surface-600">
                        {l.owner ? l.owner.fullName : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Convert button */}
                          {!isConverted && canCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConvertingLead(l);
                                setIsConvertModalOpen(true);
                              }}
                              className="text-xs px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 flex items-center gap-1"
                              title="Convert Lead into Account and Contact"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Convert
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/leads/${l.id}`)}
                            title="View Details"
                            className="p-1.5 text-surface-500 hover:text-brand-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {canCreate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLead(l);
                                setIsFormModalOpen(true);
                              }}
                              title="Edit Lead"
                              className="p-1.5 text-surface-500 hover:text-amber-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLead(l.id, fullName)}
                              disabled={deletingId === l.id}
                              title="Delete Lead"
                              className="p-1.5 text-surface-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50/50 text-xs text-surface-500">
            <div>
              Showing <span className="font-medium text-surface-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium text-surface-700">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium text-surface-700">{pagination.totalItems}</span> leads
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1 || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <span className="text-surface-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingLead(null);
        }}
        onSuccess={(saved) => {
          console.log('[LeadList] Lead saved:', saved.id);
          setSuccessNotice(`Lead "${[saved.firstName, saved.lastName].filter(Boolean).join(' ')}" saved successfully.`);
          fetchLeads(pagination.page, searchTerm, statusFilter, ratingFilter, conversionFilter);
        }}
        leadToEdit={editingLead}
      />

      {/* Lead Convert Modal */}
      <LeadConvertModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setConvertingLead(null);
        }}
        onSuccess={(res) => {
          console.log('[LeadList] Lead converted:', res);
          setSuccessNotice('Lead successfully converted into Account and Contact.');
          fetchLeads(pagination.page, searchTerm, statusFilter, ratingFilter, conversionFilter);
        }}
        lead={convertingLead}
      />
    </div>
  );
};
