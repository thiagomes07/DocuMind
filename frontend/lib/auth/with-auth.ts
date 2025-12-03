import { refreshWithLock } from './refresh-lock';

/**
 * Wrapper for API calls that automatically handles 401 errors with token refresh
 * Implements automatic retry after successful token refresh
 * 
 * @param action - The API call function to execute
 * @returns The result of the API call
 * @throws Error if the call fails after refresh attempt or if refresh triggers logout
 */
export async function withAuth<T>(
  action: () => Promise<T>
): Promise<T> {
  try {
    // Try the original action
    return await action();
  } catch (error: any) {
    // Check if error is 401 Unauthorized
    if (error?.status === 401 || error?.message?.includes('401')) {
      console.log('401 detected, attempting token refresh...');

      // Attempt token refresh with lock
      const { success, shouldLogout } = await refreshWithLock();

      if (success) {
        console.log('Token refresh successful, retrying action...');
        // Retry the original action with new token
        return await action();
      }

      if (shouldLogout) {
        console.log('Token refresh failed, user should logout');
        // Create a special error to signal logout is needed
        const logoutError = new Error('Session expired');
        (logoutError as any).shouldLogout = true;
        throw logoutError;
      }

      // Network error during refresh - throw original error
      console.log('Token refresh failed (network), throwing original error');
      throw error;
    }

    // Not a 401 error, rethrow original error
    throw error;
  }
}

/**
 * Check if error requires logout
 */
export function shouldLogoutFromError(error: any): boolean {
  return error?.shouldLogout === true;
}