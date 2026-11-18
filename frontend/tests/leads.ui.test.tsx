import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LeadStatusBadge } from '../src/features/leads/components/LeadStatusBadge';

describe('Lead UI Components', () => {
  it('renders New status badge with correct text', () => {
    render(<LeadStatusBadge status="New" />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders Qualified status badge with correct text', () => {
    render(<LeadStatusBadge status="Qualified" />);
    expect(screen.getByText('Qualified')).toBeInTheDocument();
  });

  it('renders Converted status badge with correct text', () => {
    render(<LeadStatusBadge status="Converted" />);
    expect(screen.getByText('Converted')).toBeInTheDocument();
  });
});
