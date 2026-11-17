import { supabase } from '../lib/supabase';
import { ApiResponse } from '../types';

// =============================================================================
// HTTP API Client
// Routes all business requests to the Node.js Express backend with JWT headers
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, code: string = 'API_ERROR', statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Step 1: Log outgoing backend API request
  console.log(`[ApiClient] Step 1: Initiating request to: ${endpoint}`);

  // Step 2: Retrieve current Supabase access token from active session
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  // Step 3: Configure HTTP headers
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('[ApiClient] Step 3: Attached Bearer token to request headers');
  }

  // Step 4: Execute fetch request
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[ApiClient] Step 4: Received response [${res.status}] from ${endpoint}`);

    // Parse JSON envelope
    const data: ApiResponse<T> = await res.json();

    // Step 5: Check business response status
    if (!res.ok || !data.success) {
      console.warn(`[ApiClient] Step 5: Request failed with message: ${data.message}`);
      throw new ApiError(
        data.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        res.status,
        data.error?.details
      );
    }

    return data.data;
  } catch (err: unknown) {
    // Step 6: Handle network or client-side errors peacefully
    if (err instanceof ApiError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Network error or server unreachable';
    console.error(`[ApiClient] Step 6: Network exception on ${endpoint}: ${msg}`);
    throw new ApiError(msg, 'NETWORK_ERROR', 503);
  }
}
