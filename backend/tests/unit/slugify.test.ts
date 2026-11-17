import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/slugify.js';

// =============================================================================
// Unit Tests: Slugify Utility
// Verifies URL slug generation, whitespace handling, and fallback behavior
// =============================================================================

describe('Slugify Utility Unit Tests', () => {
  it('Step 1: Converts standard organization names to lowercase hyphenated slugs', () => {
    // Step 1: Input text transformation test
    console.log('[Test] Step 1: Testing standard organization name transformation');
    const result = slugify('Acme Corporation');
    expect(result).toBe('acme-corporation');
  });

  it('Step 2: Strips special characters and punctuation cleanly', () => {
    // Step 2: Special character stripping test
    console.log('[Test] Step 2: Testing special character stripping');
    const result = slugify('Stark & Wayne, Inc. (Global)!');
    expect(result).toBe('stark-wayne-inc-global');
  });

  it('Step 3: Handles consecutive whitespace and hyphen consolidation', () => {
    // Step 3: Consecutive whitespace test
    console.log('[Test] Step 3: Testing consecutive whitespace and hyphens');
    const result = slugify('  Massive   Dynamic -- Labs  ');
    expect(result).toBe('massive-dynamic-labs');
  });

  it('Step 4: Generates fallback slug for empty or whitespace-only inputs', () => {
    // Step 4: Fallback test
    console.log('[Test] Step 4: Testing empty input fallback generation');
    const result = slugify('   ');
    expect(result).toMatch(/^org-[a-z0-9]+$/);
  });
});
