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
    expiresAt: string;
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
        this.tokens = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresAt: result.expiresAt,
        };
        return result;
    }

    /** Refresh the access token using the stored refresh token */
    async refreshToken(): Promise<AuthResult> {
        const result = await this.request<AuthResult>('refreshToken');
        this.tokens = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresAt: result.expiresAt,
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

    /** Check if the user has valid tokens */
    isLoggedIn(): boolean {
        if (!this.tokens) return false;
        return new Date(this.tokens.expiresAt) > new Date();
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

