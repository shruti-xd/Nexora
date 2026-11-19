import { describe, it, expect } from 'vitest';
import {
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
} from '../../src/modules/accounts/accounts.validators.js';
import {
  createContactSchema,
  updateContactSchema,
  contactQuerySchema,
} from '../../src/modules/contacts/contacts.validators.js';
import {
  createLeadSchema,
  updateLeadSchema,
  leadQuerySchema,
  convertLeadSchema,
} from '../../src/modules/leads/leads.validators.js';

// =============================================================================
// Module 02 Validators Unit Tests
// Tests Zod schema validations for Leads, Accounts, Contacts, and Conversion DTOs
// =============================================================================

describe('Module 02 CRM Validators', () => {
  // Step 1: Accounts Validators
  describe('Accounts Validation', () => {
    it('Step 1.1: Validates valid account creation payload', () => {
      console.log('[Test] Step 1.1: Validating valid account creation payload');
      const valid = createAccountSchema.safeParse({
        name: 'Acme Technologies Inc.',
        accountType: 'CUSTOMER',
        industry: 'Software',
        website: 'https://acme.tech',
        email: 'sales@acme.tech',
        annualRevenue: 5000000,
        employeeCount: 150,
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.name).toBe('Acme Technologies Inc.');
        expect(valid.data.accountType).toBe('CUSTOMER');
      }
    });

    it('Step 1.2: Rejects account creation with missing name or invalid type', () => {
      console.log('[Test] Step 1.2: Validating account rejection with missing name');
      const emptyName = createAccountSchema.safeParse({
        name: '',
      });
      expect(emptyName.success).toBe(false);

      const invalidType = createAccountSchema.safeParse({
        name: 'Valid Name',
        accountType: 'NON_EXISTENT_TYPE',
      });
      expect(invalidType.success).toBe(false);
    });

    it('Step 1.3: Validates account query options', () => {
      console.log('[Test] Step 1.3: Validating account query options parser');
      const query = accountQuerySchema.safeParse({
        page: '2',
        limit: '15',
        accountType: 'PROSPECT',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(query.success).toBe(true);
      if (query.success) {
        expect(query.data.page).toBe(2);
        expect(query.data.limit).toBe(15);
      }
    });
  });

  // Step 2: Contacts Validators
  describe('Contacts Validation', () => {
    it('Step 2.1: Validates valid contact creation payload', () => {
      console.log('[Test] Step 2.1: Validating contact creation payload');
      const valid = createContactSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-0199',
        department: 'Engineering',
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.lastName).toBe('Doe');
      }
    });

    it('Step 2.2: Rejects contact creation without last name or invalid email', () => {
      console.log('[Test] Step 2.2: Validating contact rejection on missing last name');
      const noLastName = createContactSchema.safeParse({
        firstName: 'Jane',
      });
      expect(noLastName.success).toBe(false);

      const invalidEmail = createContactSchema.safeParse({
        lastName: 'Doe',
        email: 'not-an-email',
      });
      expect(invalidEmail.success).toBe(false);
    });
  });

  // Step 3: Leads Validators
  describe('Leads Validation', () => {
    it('Step 3.1: Validates valid lead creation payload', () => {
      console.log('[Test] Step 3.1: Validating lead creation payload');
      const valid = createLeadSchema.safeParse({
        firstName: 'John',
        lastName: 'Smith',
        company: 'Apex Cloud Solutions',
        source: 'WEBSITE',
        status: 'NEW',
        rating: 'HOT',
        email: 'john@apexcloud.com',
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.company).toBe('Apex Cloud Solutions');
        expect(valid.data.status).toBe('NEW');
        expect(valid.data.rating).toBe('HOT');
      }
    });

    it('Step 3.2: Rejects lead creation without company or invalid status', () => {
      console.log('[Test] Step 3.2: Validating lead rejection on missing company');
      const noCompany = createLeadSchema.safeParse({
        lastName: 'Smith',
      });
      expect(noCompany.success).toBe(false);

      const invalidStatus = createLeadSchema.safeParse({
        lastName: 'Smith',
        company: 'Apex Cloud',
        status: 'INVALID_STATUS',
      });
      expect(invalidStatus.success).toBe(false);
    });
  });

  // Step 4: Lead Conversion Validators
  describe('Lead Conversion Validation', () => {
    it('Step 4.1: Validates convert lead schema with new account and contact', () => {
      console.log('[Test] Step 4.1: Validating lead conversion to new account and contact');
      const valid = convertLeadSchema.safeParse({
        createNewAccount: true,
        accountName: 'Converted Global Corp',
        createNewContact: true,
        contactFirstName: 'Alice',
        contactLastName: 'Wonderland',
        contactEmail: 'alice@wonderland.com',
      });

      expect(valid.success).toBe(true);
    });

    it('Step 4.2: Validates convert lead schema linking to existing account', () => {
      console.log('[Test] Step 4.2: Validating lead conversion linking to existing account');
      const valid = convertLeadSchema.safeParse({
        createNewAccount: false,
        existingAccountId: '123e4567-e89b-12d3-a456-426614174000',
        createNewContact: true,
        contactLastName: 'Smith',
      });

      expect(valid.success).toBe(true);
    });

    it('Step 4.3: Rejects conversion with createNewAccount=false without existingAccountId', () => {
      console.log('[Test] Step 4.3: Validating rejection when linking existing account without id');
      const invalid = convertLeadSchema.safeParse({
        createNewAccount: false,
        createNewContact: true,
        contactLastName: 'Smith',
      });

      expect(invalid.success).toBe(false);
    });
  });
});
