import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  FileText,
  Building,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Lead, Activity } from '../../../types/lead.types';
import { LeadStatusBadge } from './LeadStatusBadge';
import { leadService } from '../../../services/leadService';

// =============================================================================
// Lead Detail Drawer
// Slide-over panel displaying Lead fields and chronological Activity timeline
// =============================================================================

interface LeadDetailDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenConvertModal: (lead: Lead) => void;
  onLeadUpdated: () => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onOpenConvertModal,
  onLeadUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // New activity form states
  const [actType, setActType] = useState<'Task' | 'Call' | 'Meeting' | 'Email' | 'Note'>('Task');
  const [actSubject, setActSubject] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Load activities when drawer opens with a lead
  useEffect(() => {
    if (isOpen && lead) {
      loadActivities(lead.id);
    }
  }, [isOpen, lead?.id]);

  const loadActivities = async (leadId: string) => {
    try {
      setIsLoadingActivities(true);
      const data = await leadService.listActivities(leadId);
      setActivities(data);
    } catch {
      // Activity load errors handled gracefully
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !actSubject.trim()) return;

    try {
      setIsSubmittingActivity(true);
      const newAct = await leadService.createActivity(lead.id, {
        type: actType,
        subject: actSubject.trim(),
        description: actDescription.trim() || undefined,
        completed: actType !== 'Task',
      });
      setActivities((prev) => [newAct, ...prev]);
      setActSubject('');
      setActDescription('');
    } catch (err) {
      console.error('Failed to log activity', err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  if (!isOpen || !lead) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'Meeting':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-amber-600" />;
      case 'Note':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Task':
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />;
    }
  };

  return (
    <div className="fixed top-0 right-0 bottom-0 z-40 w-full sm:max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Lead
            </span>
            <LeadStatusBadge status={lead.status} />
          </div>
          <h2 className="text-lg font-bold mt-2">
            {lead.first_name} {lead.last_name}
          </h2>
          <p className="text-xs text-slate-300">
            {lead.title ? `${lead.title} at ` : ''}
            <strong>{lead.company}</strong> · {lead.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lead.status !== 'Converted' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConvertModal(lead);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Convert</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Activity Timeline ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Lead Information
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Quick Log Activity Form */}
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider">
                    Log Activity
                  </h4>
                  {/* Activity Type Selector */}
                  <div className="flex rounded-lg bg-surface-200/80 p-0.5 text-[11px] font-medium">
                    {(['Task', 'Call', 'Meeting', 'Email', 'Note'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActType(type)}
                        className={`px-2 py-0.5 rounded-md transition ${
                          actType === type ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreateActivity} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    value={actSubject}
                    onChange={(e) => setActSubject(e.target.value)}
                    placeholder={`e.g. ${actType === 'Call' ? 'Follow-up discussion on budget' : 'Demo review call scheduled'}`}
                    className="w-full px-3 py-1.5 border border-surface-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <textarea
                    rows={2}
                    value={actDescription}
                    onChange={(e) => setActDescription(e.target.value)}
                    placeholder="Key talking points or next action items (optional)..."
                    className="w-full px-3 py-1.5 border border-surface-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingActivity || !actSubject.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSubmittingActivity ? 'Saving...' : `Log ${actType}`}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Activity Timeline Feed */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider">
                  Timeline History
                </h4>

                {isLoadingActivities ? (
                  <div className="p-4 text-center text-xs text-surface-500">Loading timeline...</div>
                ) : activities.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-surface-200 text-xs text-surface-500">
                    No activities recorded yet. Log your first call, meeting or note above.
                  </div>
                ) : (
                  <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
                    {activities.map((act) => (
                      <div key={act.id} className="relative pl-8 text-xs">
                        <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-white border border-surface-300 flex items-center justify-center">
                          {getActivityIcon(act.type)}
                        </div>
                        <div className="p-3 rounded-lg border border-surface-200/80 bg-white shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-surface-900">{act.subject}</span>
                            <span className="text-[10px] text-surface-400">
                              {new Date(act.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-surface-600 mt-1 leading-relaxed">{act.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50 space-y-3">
                <h4 className="font-bold text-surface-800 uppercase tracking-wider text-[11px]">
                  Core Attributes
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-surface-500 block">Company:</span>
                    <span className="font-semibold text-surface-900">{lead.company}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Job Title:</span>
                    <span className="font-medium text-surface-900">{lead.title || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Email Address:</span>
                    <span className="font-mono text-surface-900">{lead.email}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Phone:</span>
                    <span className="font-mono text-surface-900">{lead.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Lead Source:</span>
                    <span className="font-medium text-surface-900">{lead.source || 'Direct'}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Estimated Value:</span>
                    <span className="font-semibold text-emerald-700">
                      ${Number(lead.estimated_value || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50 space-y-3">
                <h4 className="font-bold text-surface-800 uppercase tracking-wider text-[11px]">
                  System & Lifecycle
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-surface-500 block">Status:</span>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div>
                    <span className="text-surface-500 block">Assigned Owner:</span>
                    <span className="text-surface-900 font-medium">
                      {lead.profiles?.full_name || 'Organization Sales Team'}
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Created On:</span>
                    <span className="text-surface-700">
                      {new Date(lead.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Last Modified:</span>
                    <span className="text-surface-700">
                      {new Date(lead.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
