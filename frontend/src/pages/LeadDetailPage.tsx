import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leadsService } from '../services/leadsService';
import { Lead, LeadStatus, LeadRating } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert } from '../components/ui/alert';
import { LeadFormModal } from '../features/leads/LeadFormModal';
import { LeadConvertModal } from '../features/leads/LeadConvertModal';
import {
  Users2,
  ArrowLeft,
  Edit,
  Trash2,
  Sparkles,
  Building2,
  UserSquare2,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// Lead Detail Page Component
// Comprehensive lead view with conversion status banner & convert action
// =============================================================================

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const canEdit = role !== 'VIEWER';

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Step 1: Fetch lead details
  const loadLead = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[LeadDetailPage] Step 1: Loading lead for ID: ${id}`);
      const data = await leadsService.getLeadById(id);
      console.log(`[LeadDetailPage] Step 1: Loaded lead "${data.company}"`);
      setLead(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load lead details';
      console.error('[LeadDetailPage] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // Step 2: Delete lead
  const handleDelete = async () => {
    if (!lead) return;
    const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ');
    if (!window.confirm(`Are you sure you want to delete lead "${fullName}"?`)) {
      return;
    }

    try {
      console.log(`[LeadDetailPage] Step 2: Deleting lead ${lead.id}`);
      await leadsService.deleteLead(lead.id);
      navigate('/leads');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lead';
      console.error('[LeadDetailPage] Step 2 Failed:', msg);
      setErrorMessage(msg);
    }
  };

  const renderStatusBadge = (status: LeadStatus, isConverted: boolean) => {
    if (isConverted) {
      return (
        <Badge variant="success" className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
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

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-3" />
        <p className="text-surface-600 text-sm">Loading lead profile...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-16 text-center space-y-4">
        <Users2 className="w-12 h-12 text-surface-300 mx-auto" />
        <h2 className="text-xl font-semibold text-surface-800">Lead Not Found</h2>
        <p className="text-surface-500 text-sm">The requested lead does not exist or has been removed.</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  const isConverted = Boolean(lead.convertedAt);
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/leads')}
          className="inline-flex items-center text-sm font-medium text-surface-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Leads
        </button>
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

      {/* Converted Status Banner */}
      {isConverted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                This lead was qualified and converted on {new Date(lead.convertedAt!).toLocaleDateString()}
              </p>
              <p className="text-xs text-emerald-700">
                Data has been propagated into corresponding Account and Contact entities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {lead.convertedAccountId && (
              <Link
                to={`/accounts/${lead.convertedAccountId}`}
                className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 font-medium text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5" />
                View Converted Account
              </Link>
            )}
            {lead.convertedContactId && (
              <Link
                to={`/contacts/${lead.convertedContactId}`}
                className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 font-medium text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-sm"
              >
                <UserSquare2 className="w-3.5 h-3.5" />
                View Converted Contact
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-50 rounded-xl text-brand-600 border border-brand-100">
            <Users2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-900">{fullName}</h1>
              {renderStatusBadge(lead.status, isConverted)}
              {renderRatingBadge(lead.rating)}
            </div>
            <p className="text-sm text-surface-500 mt-1 flex items-center gap-2 flex-wrap">
              {lead.title && <span>{lead.title} at</span>}
              <strong className="text-surface-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-surface-400" />
                {lead.company}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isConverted && canEdit && (
            <Button
              onClick={() => setIsConvertModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Convert Lead
            </Button>
          )}

          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4 text-surface-600" />
              Edit Lead
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Channels */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Contact & Company Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Mail className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Email</span>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-brand-600 hover:underline font-medium">
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Phone className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Phone</span>
                  <span className="font-medium text-surface-800">{lead.phone || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Mobile</span>
                  <span className="font-medium text-surface-800">{lead.mobile || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Globe className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Website</span>
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline font-medium"
                    >
                      {lead.website}
                    </a>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Qualification Info */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Pipeline & Commercial Context
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-surface-400 block">Lead Source</span>
                <span className="font-medium text-surface-800">{lead.source}</span>
              </div>

              <div>
                <span className="text-xs text-surface-400 block">Industry</span>
                <span className="font-medium text-surface-800">{lead.industry || '—'}</span>
              </div>

              <div>
                <span className="text-xs text-surface-400 block">Annual Revenue</span>
                <span className="font-medium text-surface-800">
                  {lead.annualRevenue != null ? `$${lead.annualRevenue.toLocaleString()}` : '—'}
                </span>
              </div>

              <div>
                <span className="text-xs text-surface-400 block">Employee Count</span>
                <span className="font-medium text-surface-800">
                  {lead.employeeCount != null ? lead.employeeCount.toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Address Information
            </h3>

            <div className="bg-surface-50/50 p-4 rounded-lg border border-surface-100 text-xs text-surface-600 space-y-1">
              <div>{lead.street || '—'}</div>
              <div>{[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ') || '—'}</div>
              <div>{lead.country || '—'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Notes & Description
            </h3>
            <p className="text-surface-700 text-sm whitespace-pre-line bg-surface-50 p-3 rounded-lg border border-surface-100">
              {lead.description || 'No notes available for this lead.'}
            </p>
          </div>
        </div>

        {/* Right Column: Record Metadata */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-semibold text-surface-500 uppercase tracking-wider border-b border-surface-100 pb-2">
              Record Metadata
            </h3>

            <div className="space-y-3 text-surface-600">
              <div className="flex items-center justify-between">
                <span className="text-surface-400">Owner</span>
                <span className="font-medium text-surface-700">
                  {lead.owner ? lead.owner.fullName : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-400">Created At</span>
                <span className="font-medium text-surface-700">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-400">Last Updated</span>
                <span className="font-medium text-surface-700">
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {lead.convertedAt && (
                <div className="flex items-center justify-between border-t border-surface-100 pt-2 text-emerald-700">
                  <span>Converted At</span>
                  <span className="font-medium">
                    {new Date(lead.convertedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Lead Modal */}
      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setLead(updated);
          setSuccessNotice(`Lead "${[updated.firstName, updated.lastName].filter(Boolean).join(' ')}" updated successfully.`);
        }}
        leadToEdit={lead}
      />

      {/* Convert Lead Modal */}
      <LeadConvertModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSuccess={(result) => {
          setSuccessNotice('Lead successfully converted into Account and Contact.');
          loadLead();
        }}
        lead={lead}
      />
    </div>
  );
};
