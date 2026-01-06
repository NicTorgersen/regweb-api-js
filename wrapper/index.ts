/**
 * Regweb API Serverless Wrapper (Cloudflare Workers)
 *
 * Stateless proxy - tokens are returned to client for persistence.
 * Client sends tokens back with each authenticated request.
 */

import { type Member, RegwebApi } from '@unnamed-nic/regweb-api-js';

interface Env {
    REGWEB_BASE_URL: string;
    REGWEB_CLIENT_ID: string;
    REGWEB_CLIENT_SECRET: string;
    API_KEYS: string;
}

interface RequestBody {
    action: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;

    [key: string]: unknown;
}

function validateApiKey(authHeader: string | null, apiKeys: string[]): boolean {
    if (!authHeader?.startsWith('Bearer ')) return false;
    return apiKeys.includes(authHeader.slice(7));
}

function createApi(env: Env, body: RequestBody): RegwebApi {
    const api = new RegwebApi({
        baseUrl: env.REGWEB_BASE_URL,
        clientId: env.REGWEB_CLIENT_ID,
        clientSecret: env.REGWEB_CLIENT_SECRET,
    });
    if (body.accessToken && body.refreshToken && body.expiresAt) {
        api.restoreSession(body.accessToken, body.refreshToken, new Date(body.expiresAt));
    }
    return api;
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
    });
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const apiKeys = env.API_KEYS.split(',').filter(Boolean);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        if (!validateApiKey(request.headers.get('Authorization'), apiKeys)) {
            return json({success: false, error: 'Unauthorized'}, 401);
        }

        if (request.method !== 'POST') {
            return json({success: false, error: 'Method not allowed'}, 405);
        }

        try {
            const body: RequestBody = await request.json();
            const api = createApi(env, body);

            switch (body.action) {
                case 'login': {
                    const auth = await api.login(body.username as string, body.password as string);
                    const tokens = api.getTokenInfo();
                    return json({success: true, data: {...auth, expiresAt: tokens.expiresAt?.toISOString()}});
                }
                case 'refreshToken': {
                    const auth = await api.refreshToken();
                    const tokens = api.getTokenInfo();
                    return json({success: true, data: {...auth, expiresAt: tokens.expiresAt?.toISOString()}});
                }
                case 'getUser':
                    return json({success: true, data: await api.getUser(body.expandMember as boolean ?? true)});
                case 'getMember':
                    return json({success: true, data: await api.getMember(body.id as number)});
                case 'updateMember':
                    return json({
                        success: true,
                        data: await api.updateMember(body.id as number, body.data as Partial<Member>)
                    });
                case 'lostPassword':
                    return json({success: true, data: await api.lostPassword(body.identification as string)});
                case 'logout':
                    return json({success: true});
                case 'isLoggedIn':
                    return json({success: true, data: {isLoggedIn: api.isLoggedIn()}});
                default:
                    return json({success: false, error: `Unknown action: ${body.action}`}, 400);
            }
        } catch (error) {
            return json({success: false, error: error instanceof Error ? error.message : 'Unknown error'}, 500);
        }
    },
};

