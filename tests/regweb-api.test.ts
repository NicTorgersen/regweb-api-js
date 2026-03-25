import { RegwebApi } from '../src/regweb-api';
import { RegwebApiConfig } from '../src/types';
import { RegwebProxyClient } from '../src/proxy-client';

describe('RegwebApi', () => {
    let api: RegwebApi;
    let config: RegwebApiConfig;

    beforeEach(() => {
        config = {
            baseUrl: 'https://api.example.com',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
        };
        api = new RegwebApi(config);
    });

    describe('constructor', () => {
        it('should create an instance with correct configuration', () => {
            expect(api).toBeInstanceOf(RegwebApi);
        });

        it('should handle base URL with trailing slash', () => {
            const configWithSlash = { ...config, baseUrl: 'https://api.example.com/' };
            const apiWithSlash = new RegwebApi(configWithSlash);
            expect(apiWithSlash).toBeInstanceOf(RegwebApi);
        });
    });

    describe('authentication methods', () => {
        it('should have login method', () => {
            expect(typeof api.login).toBe('function');
        });

        it('should have refreshToken method', () => {
            expect(typeof api.refreshToken).toBe('function');
        });

        it('should have isLoggedIn method', () => {
            expect(typeof api.isLoggedIn).toBe('function');
            expect(api.isLoggedIn()).toBe(false);
        });

        it('should have logout method', () => {
            expect(typeof api.logout).toBe('function');
        });
    });

    describe('API methods', () => {
        it('should have getUser method', () => {
            expect(typeof api.getUser).toBe('function');
        });

        it('should have getMember method', () => {
            expect(typeof api.getMember).toBe('function');
        });

        it('should have updateMember method', () => {
            expect(typeof api.updateMember).toBe('function');
        });

        it('should have getOptionalSelectValues method', () => {
            expect(typeof api.getOptionalSelectValues).toBe('function');
        });

        it('should have getMemberType method', () => {
            expect(typeof api.getMemberType).toBe('function');
        });

        it('should have lostPassword method', () => {
            expect(typeof api.lostPassword).toBe('function');
        });
    });

    describe('utility methods', () => {
        it('should have getTokenInfo method', () => {
            expect(typeof api.getTokenInfo).toBe('function');
        });

        it('should have restoreSession method', () => {
            expect(typeof api.restoreSession).toBe('function');
        });

        it('should have createMemberUpdate method', () => {
            expect(typeof api.createMemberUpdate).toBe('function');
        });
    });

    describe('createMemberUpdate', () => {
        it('should filter allowed fields only', () => {
            const input = {
                firstname: 'John',
                lastname: 'Doe',
                id: 123, // This should be filtered out
                active: true, // This should be filtered out
                email: 'john@example.com',
                optional_textfield1: 'Custom field',
                membertype: { id: 1, name: 'Regular' }, // This should be filtered out
            };

            const result = api.createMemberUpdate(input);

            expect(result).toEqual({
                firstname: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                optional_textfield1: 'Custom field',
            });
            expect(result).not.toHaveProperty('id');
            expect(result).not.toHaveProperty('active');
            expect(result).not.toHaveProperty('membertype');
        });

        it('should handle undefined values', () => {
            const input = {
                firstname: 'John',
                lastname: undefined,
                email: 'john@example.com',
            };

            const result = api.createMemberUpdate(input);

            expect(result).toEqual({
                firstname: 'John',
                email: 'john@example.com',
            });
            expect(result).not.toHaveProperty('lastname');
        });
    });

    describe('session management', () => {
        it('should restore session and preserve tokens', () => {
            const accessToken = 'test-access-token';
            const refreshToken = 'test-refresh-token';
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

            api.restoreSession(accessToken, refreshToken, expiresAt);

            const tokenInfo = api.getTokenInfo();
            expect(tokenInfo.accessToken).toBe(accessToken);
            expect(tokenInfo.refreshToken).toBe(refreshToken);
            expect(tokenInfo.expiresAt).toEqual(expiresAt);
            expect(api.isLoggedIn()).toBe(true);
        });

        it('should report not logged in with expired token', () => {
            const accessToken = 'test-access-token';
            const refreshToken = 'test-refresh-token';
            const expiresAt = new Date(Date.now() - 1000); // Already expired

            api.restoreSession(accessToken, refreshToken, expiresAt);

            expect(api.isLoggedIn()).toBe(false);
        });

        it('should clear tokens on logout', () => {
            api.restoreSession('token', 'refresh', new Date(Date.now() + 3600000));
            expect(api.isLoggedIn()).toBe(true);

            api.logout();

            const tokenInfo = api.getTokenInfo();
            expect(tokenInfo.accessToken).toBeNull();
            expect(tokenInfo.refreshToken).toBeNull();
            expect(api.isLoggedIn()).toBe(false);
        });
    });
});

describe('RegwebProxyClient', () => {
    let client: RegwebProxyClient;

    beforeEach(() => {
        client = new RegwebProxyClient({
            proxyUrl: 'https://proxy.example.com',
            apiKey: 'test-api-key',
        });
    });

    describe('token management', () => {
        it('should start with no tokens', () => {
            expect(client.getTokens()).toBeNull();
            expect(client.isLoggedIn()).toBe(false);
            expect(client.isRefreshTokenExpired()).toBe(true);
        });

        it('should store and retrieve tokens', () => {
            const tokens = {
                accessToken: 'access-123',
                refreshToken: 'refresh-456',
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                refreshTokenExpiresAt: new Date(Date.now() + 1209600000).toISOString(), // 14 days
            };

            client.setTokens(tokens);

            expect(client.getTokens()).toEqual(tokens);
            expect(client.isLoggedIn()).toBe(true);
            expect(client.isRefreshTokenExpired()).toBe(false);
        });

        it('should report not logged in with expired access token', () => {
            const tokens = {
                accessToken: 'access-123',
                refreshToken: 'refresh-456',
                expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
                refreshTokenExpiresAt: new Date(Date.now() + 1209600000).toISOString(),
            };

            client.setTokens(tokens);

            expect(client.isLoggedIn()).toBe(false);
            expect(client.isRefreshTokenExpired()).toBe(false); // Refresh token still valid
        });

        it('should report refresh token expired after 14 days', () => {
            const tokens = {
                accessToken: 'access-123',
                refreshToken: 'refresh-456',
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
            };

            client.setTokens(tokens);

            expect(client.isLoggedIn()).toBe(true); // Access token still valid
            expect(client.isRefreshTokenExpired()).toBe(true); // But refresh token expired
        });

        it('should clear tokens on logout', () => {
            client.setTokens({
                accessToken: 'access-123',
                refreshToken: 'refresh-456',
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                refreshTokenExpiresAt: new Date(Date.now() + 1209600000).toISOString(),
            });

            client.logout();

            expect(client.getTokens()).toBeNull();
            expect(client.isLoggedIn()).toBe(false);
            expect(client.isRefreshTokenExpired()).toBe(true);
        });
    });
});
