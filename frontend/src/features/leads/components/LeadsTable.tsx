import React from 'react';
import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import { Lead } from '../../../types/lead.types';
import { LeadStatusBadge } from './LeadStatusBadge';

// =============================================================================
// Leads Table Component
// Replicates the exact SaaS color palette and typography from the Kloudcodey spec
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
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter leads by name, company, email..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading leads pipeline...</div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">No leads found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'All'
                ? 'No leads match the selected filter. Try adjusting your search query.'
                : 'Click "+ New Lead" above to create your first prospect.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Lead Status</th>
                  <th className="py-3 px-4">Est. Deal Value</th>
                  <th className="py-3 px-4">Sales Region</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition group">
                    {/* Lead Name & Email */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectLead(lead)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 text-left block"
                      >
                        {lead.first_name} {lead.last_name}
                      </button>
                      <div className="text-xs text-slate-500 mt-0.5">{lead.email}</div>
                    </td>

                    {/* Company & Job Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{lead.company}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lead.title || 'Prospect'}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <LeadStatusBadge status={lead.status} />
                    </td>

                    {/* Est. Deal Value */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      ${Number(lead.estimated_value || 0).toLocaleString()}
                    </td>

                    {/* Sales Region */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {(lead.custom_fields?.sales_region as string) || lead.source || 'APAC South'}
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {lead.profiles?.full_name || 'Rohan Verma'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {lead.status !== 'Converted' && (
                          <button
                            type="button"
                            onClick={() => onOpenConvertModal(lead)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold transition"
                          >
                            Convert
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Edit / View Lead"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete lead "${lead.first_name} ${lead.last_name}"?`)) {
                              onDeleteLead(lead.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4" />
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
          <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {leads.length} of {totalLeads} total leads
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
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
