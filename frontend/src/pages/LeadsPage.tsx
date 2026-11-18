import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { LeadsTable } from '../features/leads/components/LeadsTable';
import { LeadCreateModal } from '../features/leads/components/LeadCreateModal';
import { LeadConvertModal } from '../features/leads/components/LeadConvertModal';
import { LeadDetailDrawer } from '../features/leads/components/LeadDetailDrawer';
import { Lead, CreateLeadPayload, ConvertLeadPayload } from '../types/lead.types';
import { leadService } from '../services/leadService';

// =============================================================================
// Leads Page
// Primary view for Lead qualification, search, conversion, and activity logs
// =============================================================================

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Drawer visibility states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Status feedback notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch leads based on active search, status filter, and pagination
  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await leadService.listLeads({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      });

      setLeads(res.leads);
      setTotalLeads(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch leads';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle lead creation
  const handleCreateLead = async (payload: CreateLeadPayload) => {
    await leadService.createLead(payload);
    setFeedback({ type: 'success', message: `Lead for ${payload.company} created successfully.` });
    fetchLeads();
  };

  // Handle lead conversion
  const handleConvertLead = async (payload: ConvertLeadPayload) => {
    if (!selectedLead) return;
    await leadService.convertLead(selectedLead.id, payload);
    setFeedback({
      type: 'success',
      message: `Lead successfully converted! Created Account, Contact, and Opportunity.`,
    });
    setIsConvertModalOpen(false);
    setIsDetailDrawerOpen(false);
    fetchLeads();
  };

  // Handle lead deletion
  const handleDeleteLead = async (leadId: string) => {
    try {
      await leadService.deleteLead(leadId);
      setFeedback({ type: 'success', message: 'Lead deleted.' });
      fetchLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lead';
      setFeedback({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Leads
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Click any Lead to open its dedicated Activity Timeline & custom fields.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Temporary Feedback Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table */}
      <LeadsTable
        leads={leads}
        totalLeads={totalLeads}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        isLoading={isLoading}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        onStatusFilterChange={(st) => {
          setStatusFilter(st);
          setCurrentPage(1);
        }}
        onPageChange={(page) => setCurrentPage(page)}
        onSelectLead={(lead) => {
          setSelectedLead(lead);
          setIsDetailDrawerOpen(true);
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenConvertModal={(lead) => {
          setSelectedLead(lead);
          setIsConvertModalOpen(true);
        }}
        onDeleteLead={handleDeleteLead}
      />

      {/* Create Lead Modal */}
      <LeadCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateLead}
      />

      {/* Convert Lead Modal */}
      {selectedLead && (
        <LeadConvertModal
          lead={selectedLead}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onConvert={handleConvertLead}
        />
      )}

      {/* Lead Detail & Timeline Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onOpenConvertModal={(lead) => {
          setSelectedLead(lead);
          setIsConvertModalOpen(true);
        }}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
};
