import React, { useRef, useEffect } from 'react';
import { Search, Edit3, Trash2, Loader2 } from 'lucide-react';
import { Lead } from '../../../types/lead.types';
import { LeadStatusBadge } from './LeadStatusBadge';

// =============================================================================
// Leads Table Component
// Main listing view with search, status filters, edit action, and infinite scrolling
// =============================================================================

interface LeadsTableProps {
  leads: Lead[];
  totalLeads: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (status: string) => void;
  onLoadMore: () => void;
  onSelectLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onOpenConvertModal: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  totalLeads,
  hasMore,
  isLoading,
  isLoadingMore,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onLoadMore,
  onSelectLead,
  onEditLead,
  onOpenConvertModal,
  onDeleteLead,
}) => {
  const statuses = ['All', 'New', 'Contacted', 'Qualified', 'Converted'];
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = sentinelRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

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
        {isLoading && leads.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Loading leads pipeline...</span>
          </div>
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
                          onClick={() => onEditLead(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Edit Lead"
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

        {/* Infinite Scroll Sentinel & Loading Indicator */}
        <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-500 border-t border-slate-100">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more leads...</span>
            </div>
          ) : !hasMore && leads.length > 0 ? (
            <span className="text-slate-400">All {totalLeads} leads loaded</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
