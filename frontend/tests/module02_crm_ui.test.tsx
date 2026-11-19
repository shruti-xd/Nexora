import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountFormModal } from '../src/features/accounts/AccountFormModal';
import { ContactFormModal } from '../src/features/contacts/ContactFormModal';
import { LeadFormModal } from '../src/features/leads/LeadFormModal';
import { LeadConvertModal } from '../src/features/leads/LeadConvertModal';
import { Lead } from '../src/types';

// =============================================================================
// Frontend UI Tests: Module 02 - Leads, Accounts, Contacts & Conversion
// =============================================================================

describe('Module 02 CRM UI Components', () => {
  // Step 1: Account Form Modal
  it('Step 1: AccountFormModal renders company name, account type, and address fields', () => {
    console.log('[Test] Step 1: Testing AccountFormModal input controls');
    render(
      <AccountFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'New Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/acme corporation/i)).toBeInTheDocument();
    expect(screen.getByText(/account type/i)).toBeInTheDocument();
    expect(screen.getByText(/billing address/i)).toBeInTheDocument();
    expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // Step 2: Contact Form Modal
  it('Step 2: ContactFormModal renders first name, last name, email, and account select', () => {
    console.log('[Test] Step 2: Testing ContactFormModal input controls');
    render(
      <ContactFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'New Contact' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Jane')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Doe')).toBeInTheDocument();
    expect(screen.getByText(/associated account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument();
  });

  // Step 3: Lead Form Modal
  it('Step 3: LeadFormModal renders required lead fields, status, and rating selector', () => {
    console.log('[Test] Step 3: Testing LeadFormModal input controls');
    render(
      <LeadFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'New Lead' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/dunder mifflin/i)).toBeInTheDocument();
    expect(screen.getByText(/status & classification/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create lead/i })).toBeInTheDocument();
  });

  // Step 4: Lead Convert Modal
  it('Step 4: LeadConvertModal renders Salesforce-style account and contact conversion options', () => {
    console.log('[Test] Step 4: Testing LeadConvertModal controls');
    const mockLead: Lead = {
      id: 'lead-test-1',
      organizationId: 'org-1',
      createdBy: 'user-1',
      firstName: 'Jim',
      lastName: 'Halpert',
      company: 'Dunder Mifflin',
      title: 'Sales Representative',
      email: 'jim@dundermifflin.com',
      phone: '+1-555-0144',
      source: 'WEBSITE',
      status: 'QUALIFIED',
      rating: 'HOT',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <MemoryRouter>
        <LeadConvertModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          lead={mockLead}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Convert Lead' })).toBeInTheDocument();
    expect(screen.getByText('1. Account Association')).toBeInTheDocument();
    expect(screen.getByText('2. Contact Association')).toBeInTheDocument();
    expect(screen.getByLabelText(/create new account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/attach to existing account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/create new contact/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /convert lead/i })).toBeInTheDocument();
  });
});
