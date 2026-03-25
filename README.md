# Regweb API JavaScript SDK

TypeScript/JavaScript SDK for the Regweb member management API with OAuth2 authentication.

## Installation

```bash
bun add regweb-api-js
# or: npm install regweb-api-js
```

## Quick Start

```typescript
import { RegwebApi } from 'regweb-api-js';

const api = new RegwebApi({
  baseUrl: 'https://your-regweb-instance.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

await api.login('username', 'password');
const user = await api.getUser();
```

## Examples

```bash
bun run demo                        # Interactive demo
bun examples/basic-usage.mjs        # Basic usage
bun examples/session-management.ts  # Session persistence
```

See [`examples/`](examples/) for more details.

## API Reference

### Authentication

#### `login(username: string, password: string): Promise<AuthResponse>`

Authenticate with username and password.

```typescript
const authResponse = await api.login('user@example.com', 'password');
console.log('Access token:', authResponse.access_token);
```

#### `refreshToken(): Promise<AuthResponse>`

Refresh the access token using the stored refresh token.

```typescript
const newTokens = await api.refreshToken();
```

#### `isLoggedIn(): boolean`

Check if the user is currently authenticated.

```typescript
if (api.isLoggedIn()) {
  console.log('User is authenticated');
}
```

#### `logout(): void`

Clear all authentication tokens.

```typescript
api.logout();
```

### User Management

#### `getUser(expandMember?: boolean): Promise<User>`

Get current user data with optional member expansion.

```typescript
// Get user with member data
const user = await api.getUser(true);

// Get user without member data
const userOnly = await api.getUser(false);
```

### Member Management

#### `getMember(id: number): Promise<Member>`

Get member data by ID.

```typescript
const member = await api.getMember(123);
console.log('Member:', member.firstname, member.lastname);
```

#### `updateMember(id: number, memberData: Partial<Member>): Promise<UpdateResult>`

Update member data. Only provided fields will be updated.

```typescript
const result = await api.updateMember(123, {
  firstname: 'John',
  lastname: 'Doe',
  email: 'john.doe@example.com',
  optional_textfield1: 'Custom value',
});

if (result.success) {
  console.log('Member updated successfully');
} else {
  console.error('Update failed:', result.errors);
}
```

#### `createMemberUpdate(updates: Partial<Member>): Partial<Member>`

Helper method to create a member update object with only allowed fields.

```typescript
const memberUpdate = api.createMemberUpdate({
  firstname: 'John',
  id: 123, // This will be filtered out
  membertype: { id: 1, name: 'Regular' }, // This will be filtered out
});
// Result: { firstname: 'John' }
```

### Optional Select Values

#### `getOptionalSelectValues(id: number): Promise<OptionalSelectValues>`

Get available options for optional select fields (1-4).

```typescript
const selectOptions = await api.getOptionalSelectValues(1);
console.log('Options:', selectOptions.values);
```

### Member Types

#### `getMemberType(id: number): Promise<MemberType>`

Get member type information.

```typescript
const memberType = await api.getMemberType(1);
console.log('Member type:', memberType.name, 'Contingent:', memberType.contingent);
```

### Password Recovery

#### `lostPassword(identification: string): Promise<LostPasswordResponse>`

Request a password reset email.

```typescript
const result = await api.lostPassword('user@example.com');
if (result.success) {
  console.log('Password reset email sent');
}
```

### Session Management

**Token Lifetimes:**
- Access token: ~1 hour (returned in `expires_in`)
- Refresh token: **14 days** (1,209,600 seconds)

#### `getTokenInfo()`

Returns current token information including expiry dates.

```typescript
const tokenInfo = api.getTokenInfo();
// { accessToken, refreshToken, expiresAt, refreshTokenExpiresAt }

// Store for persistence
localStorage.setItem('regweb_tokens', JSON.stringify({
  ...tokenInfo,
  expiresAt: tokenInfo.expiresAt?.toISOString(),
  refreshTokenExpiresAt: tokenInfo.refreshTokenExpiresAt?.toISOString(),
}));
```

#### `restoreSession(accessToken, refreshToken, expiresAt, refreshTokenExpiresAt?)`

Restore a previous session from stored tokens.

```typescript
const stored = JSON.parse(localStorage.getItem('regweb_tokens'));
api.restoreSession(
  stored.accessToken,
  stored.refreshToken,
  new Date(stored.expiresAt),
  stored.refreshTokenExpiresAt ? new Date(stored.refreshTokenExpiresAt) : undefined
);
```

#### `isRefreshTokenExpired(): boolean`

Check if the refresh token has expired (14-day lifetime).

```typescript
if (api.isRefreshTokenExpired()) {
  // User must re-authenticate - refresh token expired
  await api.login(username, password);
} else if (!api.isLoggedIn()) {
  // Access token expired but refresh token valid
  await api.refreshToken();
}
```

## Error Handling

```typescript
import { RegwebApiError } from 'regweb-api-js';

try {
  await api.login('invalid', 'credentials');
} catch (error) {
  if (error instanceof RegwebApiError) {
    console.error(error.message, error.status, error.data.error_description);
  }
}
```

| Error Code | Description |
|------------|-------------|
| `invalid_grant` | Wrong username/password |
| `invalid_client` | Wrong client ID/secret |
| `member_active_check_failed` | Account disabled |
| `unique_email_check_failed` | Email already in use |

## Type Definitions

See [`src/types.ts`](src/types.ts) for all exported types.

```typescript
import type { Member, User, MemberType, AuthResponse, UpdateResult } from 'regweb-api-js';
```

## Proxy Client (Mobile Apps)

For mobile apps that shouldn't store OAuth secrets, use the proxy client with a serverless wrapper:

```typescript
import { RegwebProxyClient } from 'regweb-api-js';

const client = new RegwebProxyClient({
  proxyUrl: 'https://your-proxy.workers.dev',
  apiKey: 'your-api-key',
});

await client.login('username', 'password');
const user = await client.getUser();
```

See [`docs/serverless-wrapper.md`](docs/serverless-wrapper.md) for deployment instructions.

## Development

```bash
bun install        # Install dependencies
bun test           # Run tests
bun run build      # Build library
bun run lint:fix   # Fix linting issues

```

## Documentation

- [Type Definitions](src/types.ts) - All TypeScript interfaces
- [Serverless Wrapper](docs/serverless-wrapper.md) - Deploy a secure proxy for mobile apps
- [Expo Integration](examples/expo-auth-example.md) - React Native/Expo guide
- [Examples](examples/) - Code examples

## License

MIT
