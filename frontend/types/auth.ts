/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * Session data with user limits
 */
export interface SessionData extends User {
  documentsCount: number;
  documentsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  user: User;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
  success: boolean;
  userId: string;
}

/**
 * Refresh token response
 */
export interface RefreshResponse {
  success: boolean;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
}

/**
 * Token refresh result for internal use
 */
export interface TokenRefreshResult {
  success: boolean;
  shouldLogout: boolean;
}