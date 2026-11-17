import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// =============================================================================
// Classnames & Tailwind Merge Utility
// Step 1: Merges standard conditional classes and resolves Tailwind conflicts
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  // Step 1: Evaluate clsx array
  // Step 2: Merge using twMerge
  return twMerge(clsx(inputs));
}
