import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contactsService } from '../../services/contactsService';
import { Contact, PaginationMeta } from '../../types';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { ContactFormModal } from './ContactFormModal';
import {
  UserSquare2,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';

// =============================================================================
// Contact List Component
// Organization Contacts directory with search, filter, and pagination
// =============================================================================

export const ContactList: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const canCreate = role !== 'VIEWER';

  // Data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Step 1: Fetch contacts
  const fetchContacts = useCallback(async (page: number, search?: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[ContactList] Step 1: Fetching contacts (Page=${page}, Search="${search || ''}")`);

      const res = await contactsService.listContacts({
        page,
        limit: 10,
        search: search || undefined,
      });

      console.log(`[ContactList] Step 1: Retrieved ${res.contacts.length} contacts (Total: ${res.pagination.totalItems})`);
      setContacts(res.contacts);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch contacts';
      console.error('[ContactList] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(pagination.page, searchTerm);
  }, [fetchContacts, pagination.page]);

  // Step 2: Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[ContactList] Step 2: Searching contacts: "${searchTerm}"`);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchContacts(1, searchTerm);
  };

  // Step 3: Handle soft delete
  const handleDeleteContact = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete contact "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setErrorMessage(null);
      console.log(`[ContactList] Step 3: Deleting contact ID: ${id}`);
      await contactsService.deleteContact(id);
      setSuccessNotice(`Contact "${name}" deleted successfully.`);
      fetchContacts(pagination.page, searchTerm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete contact';
      console.error('[ContactList] Step 3 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserSquare2 className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-surface-900">Contacts</h1>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            Manage individual client and prospect relationships across your organization.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => {
              setEditingContact(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Contact
          </Button>
        )}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
            <input
              type="text"
              placeholder="Search by first name, last name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>

          <Button type="submit" variant="outline">
            Search
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              fetchContacts(1, '');
            }}
            title="Reset Filters"
            className="p-2"
          >
            <RefreshCw className="w-4 h-4 text-surface-500" />
          </Button>
        </form>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/75 border-b border-surface-200 text-xs font-semibold uppercase tracking-wider text-surface-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Title / Dept</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <UserSquare2 className="w-10 h-10 mx-auto text-surface-300 mb-2" />
                    <p className="text-surface-700 font-medium">No contacts found</p>
                    <p className="text-surface-400 text-xs mt-1">
                      {searchTerm
                        ? 'Try modifying your search term.'
                        : 'Create your first business contact to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-surface-900">
                      <button
                        onClick={() => navigate(`/contacts/${c.id}`)}
                        className="text-left font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                      >
                        {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-surface-600">
                      {c.account ? (
                        <Link
                          to={`/accounts/${c.account.id}`}
                          className="text-surface-800 hover:text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5 text-surface-400" />
                          {c.account.name}
                        </Link>
                      ) : (
                        <span className="text-surface-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-surface-600 text-xs">
                      {[c.title, c.department].filter(Boolean).join(' • ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-surface-600 text-xs">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="text-brand-600 hover:underline">
                          {c.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-surface-600 text-xs">
                      {c.phone || c.mobile || '—'}
                    </td>
                    <td className="py-3 px-4 text-surface-600 text-xs">
                      {c.owner ? c.owner.fullName : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/contacts/${c.id}`)}
                          title="View Details"
                          className="p-1.5 text-surface-500 hover:text-brand-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingContact(c);
                              setIsFormModalOpen(true);
                            }}
                            title="Edit Contact"
                            className="p-1.5 text-surface-500 hover:text-amber-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteContact(
                                c.id,
                                [c.firstName, c.lastName].filter(Boolean).join(' ')
                              )
                            }
                            disabled={deletingId === c.id}
                            title="Delete Contact"
                            className="p-1.5 text-surface-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50/50 text-xs text-surface-500">
            <div>
              Showing <span className="font-medium text-surface-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium text-surface-700">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium text-surface-700">{pagination.totalItems}</span> contacts
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1 || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <span className="text-surface-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingContact(null);
        }}
        onSuccess={(saved) => {
          console.log('[ContactList] Contact saved:', saved.id);
          setSuccessNotice(`Contact "${[saved.firstName, saved.lastName].filter(Boolean).join(' ')}" successfully ${editingContact ? 'updated' : 'created'}.`);
          fetchContacts(pagination.page, searchTerm);
        }}
        contactToEdit={editingContact}
      />
    </div>
  );
};
