import { describe, it, expect } from 'vitest';
import {
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
  leadQuerySchema,
} from '../../src/modules/leads/leads.validators.js';

describe('Lead Module Validators', () => {
  it('validates a correct create lead payload', () => {
    const payload = {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@cyberdyne.com',
      company: 'Cyberdyne Systems',
      title: 'Head of Operations',
      status: 'New',
      source: 'Inbound',
      estimatedValue: 45000,
    };

    const result = createLeadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('fails create lead when email is invalid', () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
      company: 'Acme',
    };

    const result = createLeadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('fails create lead when company or required name is missing', () => {
    const payload = {
      firstName: '',
      lastName: 'Doe',
      email: 'john@acme.com',
    };

    const result = createLeadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates convert lead payload with opportunity options', () => {
    const payload = {
      createOpportunity: true,
      oppName: 'Acme - Enterprise Cloud',
      oppAmount: 85000,
    };

    const result = convertLeadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('transforms query params cleanly', () => {
    const parsed = leadQuerySchema.safeParse({ page: '2', limit: '25', status: 'Qualified' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(25);
      expect(parsed.data.status).toBe('Qualified');
    }
  });
});
