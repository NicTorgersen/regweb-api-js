import { HttpClient } from './http-client';
import { AuthRequest, AuthResponse } from './types';

/** Refresh token validity period: 14 days (1209600 seconds) */
const REFRESH_TOKEN_LIFETIME_SECONDS = 1209600;

/**
 * Authentication manager for handling OAuth2 tokens
 *
 * Token lifetimes:
 * - Access token: varies (typically 1 hour), returned in `expires_in`
 * - Refresh token: 14 days (1209600 seconds) from issuance
 */
export class AuthManager {
    private httpClient: HttpClient;
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private refreshTokenExpiry: Date | null = null;

    constructor(httpClient: HttpClient, clientId: string, clientSecret: string) {
        this.httpClient = httpClient;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    /**
   * Authenticate with username and password
   */
    async login(username: string, password: string): Promise<AuthResponse> {
        const authRequest: AuthRequest = {
            grant_type: 'password',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            username,
            password,
        };

        const response = await this.httpClient.post<AuthResponse>('oauth2/token', authRequest);
        const authData = response.data;

        this.setTokens(authData);
        return authData;
    }

    /**
   * Refresh the access token using the refresh token
   */
    async refreshAccessToken(): Promise<AuthResponse> {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const authRequest: AuthRequest = {
            grant_type: 'refresh_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: this.refreshToken,
        };

        const response = await this.httpClient.post<AuthResponse>('oauth2/token', authRequest);
        const authData = response.data;

        this.setTokens(authData);
        return authData;
    }

    /**
   * Get the current access token, refreshing if necessary
   */
    async getAccessToken(): Promise<string> {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please login first.');
        }

        // Check if token is expired or will expire in the next 5 minutes
        if (this.isTokenExpired()) {
            if (this.refreshToken) {
                await this.refreshAccessToken();
            } else {
                throw new Error('Access token expired and no refresh token available. Please login again.');
            }
        }

        return this.accessToken;
    }

    /**
   * Check if the user is currently logged in
   */
    isLoggedIn(): boolean {
        return this.accessToken !== null && !this.isTokenExpired();
    }

    /**
     * Logout and clear all tokens
     */
    logout(): void {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.refreshTokenExpiry = null;
    }

    /**
     * Set tokens from authentication response.
     * Preserves the existing refresh token if the server doesn't return a new one.
     *
     * Access token expiry is calculated from `expires_in`.
     * Refresh token expiry is set to 14 days from now when a new refresh token is issued.
     */
    private setTokens(authData: AuthResponse): void {
        this.accessToken = authData.access_token;

        // Only update refresh token and its expiry if server returns a new one
        if (authData.refresh_token) {
            this.refreshToken = authData.refresh_token;
            // Refresh tokens are valid for 14 days from issuance
            const refreshExpiry = new Date();
            refreshExpiry.setSeconds(refreshExpiry.getSeconds() + REFRESH_TOKEN_LIFETIME_SECONDS);
            this.refreshTokenExpiry = refreshExpiry;
        }

        // Calculate access token expiry time (subtract 5 minutes for safety margin)
        const expiryTime = new Date();
        expiryTime.setSeconds(expiryTime.getSeconds() + authData.expires_in - 300);
        this.tokenExpiry = expiryTime;
    }

    /**
     * Check if the current access token is expired
     */
    private isTokenExpired(): boolean {
        if (!this.tokenExpiry) {
            return true;
        }
        return new Date() >= this.tokenExpiry;
    }

    /**
     * Check if the refresh token is expired (14 day lifetime)
     */
    isRefreshTokenExpired(): boolean {
        if (!this.refreshTokenExpiry) {
            return true;
        }
        return new Date() >= this.refreshTokenExpiry;
    }

    /**
     * Get current token information
     */
    getTokenInfo(): {
        accessToken: string | null;
        refreshToken: string | null;
        expiresAt: Date | null;
        refreshTokenExpiresAt: Date | null;
        } {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expiresAt: this.tokenExpiry,
            refreshTokenExpiresAt: this.refreshTokenExpiry,
        };
    }

    /**
     * Restore tokens manually (useful for restoring session)
     *
     * @param accessToken - The access token
     * @param refreshToken - The refresh token
     * @param expiresAt - Access token expiry date
     * @param refreshTokenExpiresAt - Refresh token expiry date (optional, defaults to 14 days from now)
     */
    restoreTokens(
        accessToken: string,
        refreshToken: string,
        expiresAt: Date,
        refreshTokenExpiresAt?: Date
    ): void {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = expiresAt;
        this.refreshTokenExpiry = refreshTokenExpiresAt ?? null;
    }
}
