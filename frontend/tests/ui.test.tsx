import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../src/components/ui/button';
import { Badge } from '../src/components/ui/badge';
import { Input } from '../src/components/ui/input';

// =============================================================================
// Frontend UI Component Tests
// Verifies accessibility attributes, classes, and rendering
// =============================================================================

describe('Frontend UI Components', () => {
  it('Step 1: Button renders label and disabled state correctly', () => {
    // Step 1: Button render test
    console.log('[Test] Step 1: Testing Button component rendering');
    render(<Button disabled>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('Step 2: Badge renders variant text and style', () => {
    // Step 2: Badge render test
    console.log('[Test] Step 2: Testing Badge variant rendering');
    render(<Badge variant="purple">ADMIN</Badge>);
    const badge = screen.getByText('ADMIN');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-purple-700');
  });

  it('Step 3: Input renders label and error message', () => {
    // Step 3: Input render test
    console.log('[Test] Step 3: Testing Input with error message');
    render(<Input label="Email Address" error="Invalid email address" />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
  });
});
