import React from 'react';
import { LeadStatus } from '../../../types/lead.types';

// =============================================================================
// Lead Status Badge
// Displays colored pill indicating lead pipeline stage
// =============================================================================

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status }) => {
  const getStyle = (st: LeadStatus) => {
    switch (st) {
      case 'New':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Qualified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Converted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Unqualified':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(
        status
      )}`}
    >
      {status}
    </span>
  );
};
