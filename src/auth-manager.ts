import { HttpClient } from './http-client';
import { AuthRequest, AuthResponse } from './types';

/**
 * Authentication manager for handling OAuth2 tokens
 */
export class AuthManager {
    private httpClient: HttpClient;
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private tokenExpiry: Date | null = null;

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
            grant_type: 'refresh',
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
    }

    /**
   * Set tokens from authentication response
   */
    private setTokens(authData: AuthResponse): void {
        this.accessToken = authData.access_token;
        this.refreshToken = authData.refresh_token;
    
        // Calculate expiry time (subtract 5 minutes for safety margin)
        const expiryTime = new Date();
        expiryTime.setSeconds(expiryTime.getSeconds() + authData.expires_in - 300);
        this.tokenExpiry = expiryTime;
    }

    /**
   * Check if the current token is expired
   */
    private isTokenExpired(): boolean {
        if (!this.tokenExpiry) {
            return true;
        }
        return new Date() >= this.tokenExpiry;
    }

    /**
   * Get current token information
   */
    getTokenInfo(): { accessToken: string | null; refreshToken: string | null; expiresAt: Date | null } {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expiresAt: this.tokenExpiry,
        };
    }

    /**
   * Restore tokens manually (useful for restoring session)
   */
    restoreTokens(accessToken: string, refreshToken: string, expiresAt: Date): void {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = expiresAt;
    }
}
