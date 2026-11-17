import { AuthUserContext } from './api.types.js';

// =============================================================================
// Express Request Augmentation
// Attaches authenticated user and organization context to incoming requests
// =============================================================================

declare global {
  namespace Express {
    interface Request {
      userContext?: AuthUserContext;
      token?: string;
    }
  }
}

export {};
