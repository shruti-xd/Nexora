import React from 'react';
import { Search, Plus, Check, ChevronRight, Trash2, Building, Mail, Phone } from 'lucide-react';
import { Lead, LeadStatus } from '../../../types/lead.types';
import { LeadStatusBadge } from './LeadStatusBadge';

// =============================================================================
// Leads Table Component
// Main listing view with search, status filters, and row-level actions
// =============================================================================

interface LeadsTableProps {
  leads: Lead[];
  totalLeads: number;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  statusFilter: string;
  isLoading: boolean;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenCreateModal: () => void;
  onOpenConvertModal: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  totalLeads,
  currentPage,
  totalPages,
  searchTerm,
  statusFilter,
  isLoading,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onSelectLead,
  onOpenCreateModal,
  onOpenConvertModal,
  onDeleteLead,
}) => {
  const statuses = ['All', 'New', 'Contacted', 'Qualified', 'Converted'];

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Status Filter Pills & Create Action */}
      <div className="bg-white p-3.5 rounded-xl border border-surface-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by name, company, email..."
            className="w-full pl-9 pr-3 py-1.5 border border-surface-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* New Lead Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-surface-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-surface-500">Loading leads pipeline...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building className="w-8 h-8 mx-auto text-surface-300" />
            <h4 className="text-sm font-semibold text-surface-800">No leads found</h4>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'All'
                ? 'No leads matched your filter criteria. Try adjusting your query or status filter.'
                : 'Get started by creating your first sales lead to track prospects through your qualification pipeline.'}
            </p>
            {!searchTerm && statusFilter === 'All' && (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Lead</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-50/80 border-b border-surface-200 text-surface-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Lead Contact</th>
                  <th className="py-3 px-4">Company & Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-surface-50/70 transition cursor-pointer group"
                  >
                    {/* Contact Name & Email */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-surface-900 group-hover:text-brand-700 transition">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-[11px] text-surface-500 font-mono mt-0.5">{lead.email}</div>
                    </td>

                    {/* Company & Title */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-surface-900">{lead.company}</div>
                      <div className="text-[11px] text-surface-500 mt-0.5">{lead.title || 'Prospect'}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <LeadStatusBadge status={lead.status} />
                    </td>

                    {/* Est. Value */}
                    <td className="py-3 px-4 font-semibold text-surface-800">
                      ${Number(lead.estimated_value || 0).toLocaleString()}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 text-surface-600 font-medium">
                      {lead.source || 'Direct'}
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-4 text-surface-600">
                      {lead.profiles?.full_name || 'Team Pool'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.status !== 'Converted' ? (
                          <button
                            type="button"
                            title="Convert Lead"
                            onClick={() => onOpenConvertModal(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
                          >
                            <Check className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Converted
                          </span>
                        )}

                        <button
                          type="button"
                          title="View Details"
                          onClick={() => onSelectLead(lead)}
                          className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          title="Delete Lead"
                          onClick={() => {
                            if (window.confirm(`Delete lead "${lead.first_name} ${lead.last_name}"?`)) {
                              onDeleteLead(lead.id);
                            }
                          }}
                          className="p-1 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalLeads > 0 && (
          <div className="p-3.5 border-t border-surface-200/80 bg-surface-50/50 flex items-center justify-between text-xs text-surface-600">
            <span>
              Showing {leads.length} of {totalLeads} total leads
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="font-semibold text-surface-900">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
