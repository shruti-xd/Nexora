import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { LeadsTable } from '../features/leads/components/LeadsTable';
import { LeadCreateModal } from '../features/leads/components/LeadCreateModal';
import { LeadEditModal } from '../features/leads/components/LeadEditModal';
import { LeadConvertModal } from '../features/leads/components/LeadConvertModal';
import { LeadDetailDrawer } from '../features/leads/components/LeadDetailDrawer';
import { Lead, CreateLeadPayload, UpdateLeadPayload, ConvertLeadPayload } from '../types/lead.types';
import { leadService } from '../services/leadService';

// =============================================================================
// Leads Page
// Primary view for Lead qualification, search, conversion, edit, and infinite scrolling
// =============================================================================

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal & Drawer visibility states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Toast feedback notification state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss toast feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch leads batch (page 1 replaces leads, subsequent pages append)
  const fetchLeads = useCallback(
    async (pageToFetch: number, isInitial: boolean = false) => {
      try {
        if (isInitial) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const res = await leadService.listLeads({
          page: pageToFetch,
          limit: 15,
          search: searchTerm,
          status: statusFilter,
        });

        if (isInitial) {
          setLeads(res.leads);
        } else {
          setLeads((prev) => {
            // Deduplicate incoming items by id
            const existingIds = new Set(prev.map((l) => l.id));
            const freshItems = res.leads.filter((l) => !existingIds.has(l.id));
            return [...prev, ...freshItems];
          });
        }

        setTotalLeads(res.pagination.totalItems);
        setPage(pageToFetch);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch leads';
        setFeedback({ type: 'error', message: msg });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchTerm, statusFilter]
  );

  // Reset and fetch from page 1 whenever search or filter changes
  useEffect(() => {
    fetchLeads(1, true);
  }, [fetchLeads]);

  // Handle infinite scroll loading next page
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && leads.length < totalLeads) {
      fetchLeads(page + 1, false);
    }
  };

  // Handle lead creation
  const handleCreateLead = async (payload: CreateLeadPayload) => {
    await leadService.createLead(payload);
    setFeedback({ type: 'success', message: `Lead for ${payload.company} created successfully.` });
    fetchLeads(1, true);
  };

  // Handle lead editing
  const handleUpdateLead = async (leadId: string, payload: UpdateLeadPayload) => {
    const updated = await leadService.updateLead(leadId, payload);
    setFeedback({ type: 'success', message: 'Lead updated successfully.' });

    // Update in-memory lead lists
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updated } : l)));
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, ...updated } : null));
    }
    setIsEditModalOpen(false);
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
    fetchLeads(1, true);
  };

  // Handle lead deletion
  const handleDeleteLead = async (leadId: string) => {
    try {
      await leadService.deleteLead(leadId);
      setFeedback({ type: 'success', message: 'Lead deleted.' });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setTotalLeads((prev) => Math.max(0, prev - 1));
      if (selectedLead?.id === leadId) {
        setIsDetailDrawerOpen(false);
        setSelectedLead(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lead';
      setFeedback({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with responsive, un-distorted button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
            Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">
            Click any Lead to open its dedicated Activity Timeline & custom fields.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Auto-Dismissing Toast Feedback Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition shadow-xs animate-in fade-in duration-150 ${
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

      {/* Main Table with Infinite Scrolling */}
      <LeadsTable
        leads={leads}
        totalLeads={totalLeads}
        hasMore={leads.length < totalLeads}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={(val) => setSearchTerm(val)}
        onStatusFilterChange={(st) => setStatusFilter(st)}
        onLoadMore={handleLoadMore}
        onSelectLead={(lead) => {
          setSelectedLead(lead);
          setIsDetailDrawerOpen(true);
        }}
        onEditLead={(lead) => {
          setLeadToEdit(lead);
          setIsEditModalOpen(true);
        }}
        onOpenConvertModal={(lead) => {
          setSelectedLead(lead);
          setIsDetailDrawerOpen(false); // Close detail drawer so convert modal is cleanly in front
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

      {/* Edit Lead Modal */}
      <LeadEditModal
        lead={leadToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        onUpdate={handleUpdateLead}
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

      {/* Lead Detail & Timeline Drawer (Non-blocking, no dark backdrop) */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onOpenConvertModal={(lead) => {
          setIsDetailDrawerOpen(false); // Close detail drawer before opening convert modal
          setSelectedLead(lead);
          setIsConvertModalOpen(true);
        }}
        onLeadUpdated={() => fetchLeads(1, true)}
      />
    </div>
  );
};
