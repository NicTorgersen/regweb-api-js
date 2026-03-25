/**
 * Regweb Proxy Client
 *
 * A lightweight client for mobile apps to communicate with the serverless proxy.
 * This client handles token storage locally and sends them with each request.
 *
 * Key features:
 * - No SDK dependencies - just fetch calls
 * - Bearer token authentication with your API key
 * - Automatic token management
 * - Works with Expo, React Native, and web
 *
 * Token lifetimes:
 * - Access token: varies (typically 1 hour), returned in `expires_in`
 * - Refresh token: 14 days (1209600 seconds) from issuance
 *
 * @example
 * ```typescript
 * const client = new RegwebProxyClient({
 *   proxyUrl: 'https://regweb-auth-proxy.workers.dev',
 *   apiKey: 'your-api-key',
 * });
 *
 * await client.login('username', 'password');
 * const user = await client.getUser();
 * ```
 */

/** Refresh token validity period: 14 days (1209600 seconds) */
const REFRESH_TOKEN_LIFETIME_MS = 1209600 * 1000;

export interface ProxyClientConfig {
    /** URL of the deployed proxy (e.g., https://your-worker.workers.dev) */
    proxyUrl: string;
    /** API key for authenticating with the proxy */
    apiKey: string;
    /** Optional timeout in milliseconds (default: 30000) */
    timeout?: number;
}

export interface AuthResult {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    expiresAt: string;
}

export interface User {
    username: string;
    firstname: string;
    lastname: string;
    is_member: boolean;
    email: string;
    member?: Member;
}

export interface Member {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    [key: string]: unknown;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
    /** Access token expiry (ISO string) */
    expiresAt: string;
    /** Refresh token expiry (ISO string) - 14 days from issuance */
    refreshTokenExpiresAt: string;
}

export class RegwebProxyClient {
    private config: Required<ProxyClientConfig>;
    private tokens: Tokens | null = null;

    constructor(config: ProxyClientConfig) {
        this.config = { ...config, timeout: config.timeout ?? 30000 };
    }

    /** Internal method to make requests to the proxy */
    private async request<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const body: Record<string, unknown> = { action, ...params };
            if (this.tokens) {
                body.accessToken = this.tokens.accessToken;
                body.refreshToken = this.tokens.refreshToken;
                body.expiresAt = this.tokens.expiresAt;
            }

            const response = await fetch(this.config.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Request failed');
            return result.data as T;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /** Authenticate with username and password */
    async login(username: string, password: string): Promise<AuthResult> {
        const result = await this.request<AuthResult>('login', { username, password });
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS).toISOString();
        this.tokens = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresAt: result.expiresAt,
            refreshTokenExpiresAt,
        };
        return result;
    }

    /** Refresh the access token using the stored refresh token */
    async refreshToken(): Promise<AuthResult> {
        const oldRefreshToken = this.tokens?.refreshToken;
        const oldRefreshTokenExpiresAt = this.tokens?.refreshTokenExpiresAt;
        const result = await this.request<AuthResult>('refreshToken');

        // If server returns a new refresh token, calculate new expiry; otherwise preserve old
        const gotNewRefreshToken = result.refresh_token && result.refresh_token !== oldRefreshToken;
        const refreshTokenExpiresAt = gotNewRefreshToken
            ? new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS).toISOString()
            : (oldRefreshTokenExpiresAt || new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS).toISOString());

        this.tokens = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token || oldRefreshToken || '',
            expiresAt: result.expiresAt,
            refreshTokenExpiresAt,
        };
        return result;
    }

    /** Get the current user's data */
    async getUser(expandMember = true): Promise<User> {
        return this.request<User>('getUser', { expandMember });
    }

    /** Get a member by ID */
    async getMember(id: number): Promise<Member> {
        return this.request<Member>('getMember', { id });
    }

    /** Update a member's data */
    async updateMember(id: number, data: Partial<Member>): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>('updateMember', { id, data });
    }

    /** Request a password reset email */
    async lostPassword(identification: string): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>('lostPassword', { identification });
    }

    /** Clear local tokens (logout) */
    logout(): void {
        this.tokens = null;
    }

    /** Check if the user has a valid (non-expired) access token */
    isLoggedIn(): boolean {
        if (!this.tokens) return false;
        return new Date(this.tokens.expiresAt) > new Date();
    }

    /** Check if the refresh token is expired (14 day lifetime) */
    isRefreshTokenExpired(): boolean {
        if (!this.tokens?.refreshTokenExpiresAt) return true;
        return new Date(this.tokens.refreshTokenExpiresAt) <= new Date();
    }

    /** Get the current tokens (for persistence) */
    getTokens(): Tokens | null {
        return this.tokens;
    }

    /** Restore tokens (e.g., from AsyncStorage) */
    setTokens(tokens: Tokens): void {
        this.tokens = tokens;
    }
}

export default RegwebProxyClient;

