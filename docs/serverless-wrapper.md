# Regweb API Serverless Wrapper

A lightweight, secure proxy that keeps OAuth credentials server-side while exposing a simple Bearer token API to mobile clients.

## Architecture

```
┌─────────────────┐     Bearer Token      ┌──────────────────┐     OAuth2      ┌─────────────┐
│   Mobile App    │ ──────────────────▶   │ Serverless Proxy │ ─────────────▶  │  Regweb API │
│   (Expo/RN)     │                       │ (Cloudflare/etc) │                 │             │
└─────────────────┘                       └──────────────────┘                 └─────────────┘
        │                                         │
        │                                         │
        ▼                                         ▼
   API Key only                          clientId + clientSecret
   (safe to embed)                       (never exposed)
```

## Why This Approach?

- **Security**: `clientId` and `clientSecret` never leave the server
- **Simplicity**: Mobile app uses a single API key
- **Performance**: Edge deployment = low latency globally
- **Cost**: Cloudflare Workers free tier = 100k requests/day

## Quick Start (Cloudflare Workers)

### 1. Install Wrangler CLI

```bash
bun add -g wrangler
wrangler login
```

### 2. Deploy

```bash
cd wrapper
wrangler deploy
```

### 3. Set Secrets

```bash
wrangler secret put REGWEB_BASE_URL
# Enter: https://your-regweb-instance.com

wrangler secret put REGWEB_CLIENT_ID
# Enter: your-client-id

wrangler secret put REGWEB_CLIENT_SECRET
# Enter: your-client-secret

wrangler secret put API_KEYS
# Enter: your-api-key-1,your-api-key-2
```

### 4. Generate API Keys

Generate secure API keys for your mobile app:

```bash
# Generate a random API key
openssl rand -base64 32
```

## Client Usage

### Expo/React Native

```typescript
import { RegwebProxyClient } from '@unnamed-nic/regweb-api-js';

const client = new RegwebProxyClient({
  proxyUrl: 'https://regweb-auth-proxy.your-account.workers.dev',
  apiKey: 'your-api-key',
});

// Login
const auth = await client.login('username', 'password');

// Get user data
const user = await client.getUser();

// Logout
await client.logout();
```

### Token Persistence (React Native)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// After login, save tokens
await AsyncStorage.setItem('tokens', JSON.stringify(client.getTokens()));

// On app restart, restore tokens
const stored = await AsyncStorage.getItem('tokens');
if (stored) {
  client.setTokens(JSON.parse(stored));
}
```

## API Reference

All requests use `POST` with JSON body and `Authorization: Bearer <api-key>` header.

| Action | Parameters | Response |
|--------|------------|----------|
| `login` | `username`, `password` | Auth tokens + sessionId |
| `refreshToken` | - | New auth tokens |
| `getUser` | `expandMember?` | User object |
| `getMember` | `id` | Member object |
| `updateMember` | `id`, `data` | Update result |
| `lostPassword` | `identification` | Success status |
| `logout` | - | - |
| `isLoggedIn` | - | Boolean |

## Security Considerations

1. **API Keys**: Rotate regularly, use different keys per app version
2. **HTTPS**: Always use HTTPS (enforced by Cloudflare)
3. **Rate Limiting**: Add rate limiting for production (Cloudflare has built-in options)
4. **Token Storage**: Store tokens securely (AsyncStorage is fine for most apps)
5. **Stateless Design**: No server-side session state - tokens are client-managed

