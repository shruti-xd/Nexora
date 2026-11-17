import { Logger } from './logger.js';

// =============================================================================
// Slugify Utility
// Generates clean URL-safe slugs for organizations
// =============================================================================

export function slugify(text: string): string {
  // Step 1: Log incoming text for slug generation
  Logger.debug(`[slugify] Generating slug for text: "${text}"`);

  // Step 2: Transform string to lowercase and strip diacritics
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    // Step 3: Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Step 4: Remove non-alphanumeric characters except hyphens
    .replace(/[^\w-]+/g, '')
    // Step 5: Replace multiple hyphens with single hyphen
    .replace(/--+/g, '-')
    // Step 6: Trim hyphens from start and end
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  // Step 7: Fallback to random string if slug is empty
  const finalSlug = slug.length > 0 ? slug : `org-${Math.random().toString(36).substring(2, 8)}`;
  Logger.debug(`[slugify] Produced final slug: "${finalSlug}"`);
  return finalSlug;
}
