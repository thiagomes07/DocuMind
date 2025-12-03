import { TokenRefreshResult } from '@/types/auth';

/**
 * Singleton promise to prevent multiple simultaneous refresh attempts
 */
let refreshPromise: Promise<TokenRefreshResult> | null = null;

/**
 * Refresh access token with lock mechanism
 * Ensures only one refresh request is made even if multiple API calls fail simultaneously
 */
export async function refreshWithLock(): Promise<TokenRefreshResult> {
  // If a refresh is already in progress, return that promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Create new refresh promise
  refreshPromise = performRefresh()
    .finally(() => {
      // Clear the lock after completion (success or failure)
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Perform the actual token refresh
 */
async function performRefresh(): Promise<TokenRefreshResult> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      return {
        success: true,
        shouldLogout: false,
      };
    }

    // Refresh failed - user should be logged out
    return {
      success: false,
      shouldLogout: true,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Network error - don't force logout, allow retry
    return {
      success: false,
      shouldLogout: false,
    };
  }
}

/**
 * Clear the refresh lock (for testing or manual intervention)
 */
export function clearRefreshLock(): void {
  refreshPromise = null;
}