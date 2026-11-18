import React from 'react';
import { LeadStatus } from '../../../types/lead.types';

// =============================================================================
// Lead Status Badge
// Displays colored pill matching the Salesforce / Kloudcodey SaaS design system
// =============================================================================

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status }) => {
  const getStyle = (st: LeadStatus) => {
    switch (st) {
      case 'Qualified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'New':
        return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'Converted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'Unqualified':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${getStyle(
        status
      )}`}
    >
      {status}
    </span>
  );
};
