import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { contactsService } from '../services/contactsService';
import { Contact } from '../types';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import { ContactFormModal } from '../features/contacts/ContactFormModal';
import {
  UserSquare2,
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Calendar,
  Briefcase,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// Contact Detail Page Component
// Detailed profile for Contact entity with associated Account card
// =============================================================================

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const canEdit = role !== 'VIEWER';

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Step 1: Fetch contact details
  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[ContactDetailPage] Step 1: Loading contact for ID: ${id}`);
      const data = await contactsService.getContactById(id);
      console.log(`[ContactDetailPage] Step 1: Loaded contact "${data.lastName}"`);
      setContact(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load contact details';
      console.error('[ContactDetailPage] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  // Step 2: Delete contact
  const handleDelete = async () => {
    if (!contact) return;
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    if (!window.confirm(`Are you sure you want to delete contact "${fullName}"?`)) {
      return;
    }

    try {
      console.log(`[ContactDetailPage] Step 2: Deleting contact ${contact.id}`);
      await contactsService.deleteContact(contact.id);
      navigate('/contacts');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete contact';
      console.error('[ContactDetailPage] Step 2 Failed:', msg);
      setErrorMessage(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-3" />
        <p className="text-surface-600 text-sm">Loading contact details...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-16 text-center space-y-4">
        <UserSquare2 className="w-12 h-12 text-surface-300 mx-auto" />
        <h2 className="text-xl font-semibold text-surface-800">Contact Not Found</h2>
        <p className="text-surface-500 text-sm">The contact does not exist or has been deleted.</p>
        <Button variant="outline" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center text-sm font-medium text-surface-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contacts
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

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-50 rounded-xl text-brand-600 border border-brand-100">
            <UserSquare2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{fullName}</h1>
            <p className="text-sm text-surface-500 mt-1 flex items-center gap-2 flex-wrap">
              {[contact.title, contact.department].filter(Boolean).join(' • ') || 'No title specified'}
              {contact.account && (
                <>
                  <span>at</span>
                  <Link
                    to={`/accounts/${contact.account.id}`}
                    className="font-medium text-brand-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {contact.account.name}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4 text-surface-600" />
              Edit Contact
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
        {/* Left Column: Contact info & addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Methods */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Communication Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Mail className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Email Address</span>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="text-brand-600 hover:underline font-medium">
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Phone className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Work Phone</span>
                  <span className="font-medium text-surface-800">{contact.phone || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Mobile Phone</span>
                  <span className="font-medium text-surface-800">{contact.mobile || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100">
                <Briefcase className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs text-surface-400 block">Department</span>
                  <span className="font-medium text-surface-800">{contact.department || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mailing Address */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Mailing Address
            </h3>

            <div className="bg-surface-50/50 p-4 rounded-lg border border-surface-100 text-xs text-surface-600 space-y-1">
              <div>{contact.mailingStreet || '—'}</div>
              <div>
                {[contact.mailingCity, contact.mailingState, contact.mailingPostalCode].filter(Boolean).join(', ') || '—'}
              </div>
              <div>{contact.mailingCountry || '—'}</div>
            </div>
          </div>

          {/* Description / Notes */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Background Notes
            </h3>
            <p className="text-surface-700 text-sm whitespace-pre-line bg-surface-50 p-3 rounded-lg border border-surface-100">
              {contact.description || 'No background notes recorded.'}
            </p>
          </div>
        </div>

        {/* Right Column: Account Card & System Info */}
        <div className="space-y-6">
          {/* Associated Account Card */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-semibold text-surface-500 uppercase tracking-wider border-b border-surface-100 pb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              Associated Account
            </h3>

            {contact.account ? (
              <div className="space-y-3">
                <Link
                  to={`/accounts/${contact.account.id}`}
                  className="font-semibold text-brand-600 hover:text-brand-800 text-sm hover:underline block"
                >
                  {contact.account.name}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/accounts/${contact.account!.id}`)}
                  className="w-full text-xs"
                >
                  View Account Profile
                </Button>
              </div>
            ) : (
              <p className="text-surface-400 italic">This contact is not currently associated with an account.</p>
            )}
          </div>

          {/* System Info */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-semibold text-surface-500 uppercase tracking-wider border-b border-surface-100 pb-2">
              Record Info
            </h3>

            <div className="space-y-3 text-surface-600">
              <div className="flex items-center justify-between">
                <span className="text-surface-400">Record Owner</span>
                <span className="font-medium text-surface-700">
                  {contact.owner ? contact.owner.fullName : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-400">Created At</span>
                <span className="font-medium text-surface-700">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-400">Last Updated</span>
                <span className="font-medium text-surface-700">
                  {new Date(contact.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      <ContactFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setContact(updated);
          setSuccessNotice(`Contact "${[updated.firstName, updated.lastName].filter(Boolean).join(' ')}" updated successfully.`);
        }}
        contactToEdit={contact}
      />
    </div>
  );
};
