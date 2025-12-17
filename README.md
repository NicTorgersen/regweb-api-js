# Regweb API JavaScript SDK

A modern TypeScript/JavaScript SDK for the Regweb member management API with full OAuth2 support and comprehensive type safety.

## Features

- **OAuth2 Authentication** - Automatic token management with refresh
- **Full TypeScript Support** - Complete type definitions with IntelliSense
- **Modern HTTP Client** - Built on Axios with intelligent error handling
- **Auto Token Refresh** - Seamless token renewal and session management
- **Multiple Build Formats** - ESM and CommonJS builds with source maps
- **Comprehensive Testing** - Jest test suite with coverage reporting
- **Advanced Error Handling** - Detailed error responses with proper typing
- **Modern Tooling** - ESLint, Rollup, and TypeScript 5.9+
- **Interactive Demo** - Built-in terminal demo for testing
- **Session Persistence** - Token storage and restoration utilities

## Requirements

- **Bun**: 1.0.0 or higher (recommended - fast, modern JavaScript runtime)
- TypeScript: 5.0.0 or higher (for TypeScript projects)
- Modern JavaScript Environment: ES2020+ support

> **Why Bun?** Bun is significantly faster than Node.js for package management, testing, and running JavaScript/TypeScript. It provides native TypeScript support, built-in testing, and excellent performance.
>
> **Performance Comparison:**
> - Package installation: ~3-5x faster than npm
> - Test execution: ~2-3x faster than Jest
> - TypeScript compilation: Native support, no additional tooling needed
> - Startup time: ~10x faster than Node.js

## Installation

```bash
# Using Bun (recommended - fastest)
bun add regweb-api-js

# Using npm
npm install regweb-api-js

# Using yarn
yarn add regweb-api-js

# Using pnpm
pnpm add regweb-api-js
```

## Quick Start

### TypeScript/ES Modules

```typescript
import { RegwebApi, RegwebApiError } from 'regweb-api-js';

// Initialize the API client
const api = new RegwebApi({
  baseUrl: 'https://your-regweb-instance.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  timeout: 30000, // optional, defaults to 30 seconds
});

// Authenticate with comprehensive error handling
try {
  const authResponse = await api.login('username', 'password');
  console.log('Logged in successfully!', {
    tokenType: authResponse.token_type,
    expiresIn: authResponse.expires_in,
    scope: authResponse.scope
  });
} catch (error) {
  if (error instanceof RegwebApiError) {
    console.error('Login failed:', {
      message: error.message,
      status: error.status,
      errorCode: error.data.error,
      description: error.data.error_description
    });
  } else {
    console.error('Unexpected error:', error);
  }
}

// Get current user with member data
const user = await api.getUser(true);
console.log('Current user:', user);
```

### CommonJS

```javascript
const { RegwebApi, RegwebApiError } = require('regweb-api-js');

// Same usage as above
const api = new RegwebApi({
  baseUrl: 'https://your-regweb-instance.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});
```

## Examples

### Interactive Demo

Run the comprehensive interactive demo to test the API with your credentials:

```bash
# Run the interactive demo (recommended for first-time setup)
bun run demo

# Alternative with npm (slower)
npm run demo
```

The demo provides:
- Interactive prompts for API configuration and credentials
- Secure password input (hidden from terminal)
- Complete API testing including:
  - OAuth2 authentication flow
  - User data retrieval with member expansion
  - Member information display and updates
  - Optional select values and member types
  - Password recovery functionality
  - Session management demonstration

### Example Files

| File | Description | Usage |
|------|-------------|-------|
| `examples/interactive-demo.mjs` | Comprehensive interactive terminal demo | `bun run demo` |
| `examples/basic-usage.mjs` | Basic API operations and error handling | `bun examples/basic-usage.mjs` |
| `examples/session-management.ts` | Advanced session persistence and token management | `bun examples/session-management.ts` |

See [`examples/README.md`](examples/README.md) for detailed documentation of each example.

## Migrating from Node.js to Bun

If you're currently using Node.js, migrating to Bun is straightforward:

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install dependencies with Bun
bun install

# Run tests with Bun (much faster)
bun test

# Build with Bun
bun run build
```

**Benefits of switching:**
- Faster package installation and dependency resolution
- Native TypeScript support without additional configuration
- Built-in test runner that's faster than Jest
- Better performance for development workflows
- Single binary with no external dependencies

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

#### `getTokenInfo(): { accessToken: string | null; refreshToken: string | null; expiresAt: Date | null }`

Get current token information for session persistence.

```typescript
const tokenInfo = api.getTokenInfo();
console.log('Token info:', {
  hasAccessToken: !!tokenInfo.accessToken,
  hasRefreshToken: !!tokenInfo.refreshToken,
  expiresAt: tokenInfo.expiresAt,
  isExpired: tokenInfo.expiresAt ? new Date() > tokenInfo.expiresAt : true
});

// Store tokens for later restoration
if (tokenInfo.accessToken && tokenInfo.refreshToken && tokenInfo.expiresAt) {
  localStorage.setItem('regweb_tokens', JSON.stringify({
    accessToken: tokenInfo.accessToken,
    refreshToken: tokenInfo.refreshToken,
    expiresAt: tokenInfo.expiresAt.toISOString()
  }));
}
```

#### `restoreSession(accessToken: string, refreshToken: string, expiresAt: Date): void`

Restore a previous authentication session from stored tokens.

```typescript
// Restore from stored tokens
const storedTokens = localStorage.getItem('regweb_tokens');
if (storedTokens) {
  const { accessToken, refreshToken, expiresAt } = JSON.parse(storedTokens);
  api.restoreSession(
    accessToken,
    refreshToken,
    new Date(expiresAt)
  );

  // Check if session is still valid
  if (api.isLoggedIn()) {
    console.log('Session restored successfully');
  } else {
    console.log('Session expired, please login again');
  }
}
```

## Error Handling

The SDK provides comprehensive error handling through the `RegwebApiError` class with detailed error information:

```typescript
import { RegwebApiError } from 'regweb-api-js';

try {
  await api.login('invalid', 'credentials');
} catch (error) {
  if (error instanceof RegwebApiError) {
    console.error('API Error Details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorCode: error.data.error,
      description: error.data.error_description
    });

    // Handle specific error conditions
    if (error.data.member_active_check_failed) {
      console.error('Member account is not active');
      // Redirect to account activation flow
    }

    if (error.data.unique_email_check_failed) {
      console.error('Email address is already in use');
      // Show email conflict resolution options
    }

    // Handle different HTTP status codes
    switch (error.status) {
      case 401:
        console.error('Authentication failed - check credentials');
        break;
      case 403:
        console.error('Access forbidden - insufficient permissions');
        break;
      case 404:
        console.error('Resource not found');
        break;
      case 429:
        console.error('Rate limit exceeded - please wait before retrying');
        break;
      case 500:
        console.error('Server error - please try again later');
        break;
      default:
        console.error(`Unexpected error: ${error.status} ${error.statusText}`);
    }
  } else {
    // Handle network errors, timeouts, etc.
    console.error('Network or unexpected error:', error.message);
  }
}
```

### Common Error Scenarios

| Error Code | Description | Typical Cause | Resolution |
|------------|-------------|---------------|------------|
| `invalid_grant` | Authentication failed | Wrong username/password | Verify credentials |
| `invalid_client` | Client authentication failed | Wrong client ID/secret | Check API credentials |
| `member_active_check_failed` | Member account inactive | Account disabled | Contact administrator |
| `unique_email_check_failed` | Email already exists | Duplicate email in update | Use different email |

## TypeScript Support

The SDK is built with TypeScript 5.9+ and provides comprehensive type definitions with full IntelliSense support:

```typescript
import {
  RegwebApi,
  Member,
  User,
  UpdateResult,
  RegwebApiConfig,
  AuthResponse,
  MemberType,
  OptionalSelectValues,
  RegwebApiError
} from 'regweb-api-js';

// Configuration is fully typed
const config: RegwebApiConfig = {
  baseUrl: 'https://api.example.com',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  timeout: 30000 // optional
};

const api = new RegwebApi(config);

// All methods return properly typed responses
const authResponse: AuthResponse = await api.login('user', 'pass');
const user: User = await api.getUser(true); // expandMember parameter is typed
const member: Member = await api.getMember(123);
const memberType: MemberType = await api.getMemberType(1);
const selectValues: OptionalSelectValues = await api.getOptionalSelectValues(1);

// Update operations are type-safe
const updateData: Partial<Member> = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'john.doe@example.com',
  optional_textfield1: 'Custom value'
};

const result: UpdateResult = await api.updateMember(123, updateData);

// Helper methods maintain type safety
const filteredUpdate = api.createMemberUpdate({
  firstname: 'John',
  id: 123, // This will be filtered out automatically
  membertype: { id: 1, name: 'Regular' } // This will be filtered out too
});
// Result type: { firstname: string }
```

### Type Definitions

All interfaces are exported for use in your application:

```typescript
// Import specific types as needed
import type {
  Member,
  User,
  MemberType,
  AuthResponse,
  UpdateResult,
  ApiError
} from 'regweb-api-js';
```

## Data Models

### User Object

```typescript
interface User {
  username: string;
  firstname: string;
  lastname: string;
  is_member: boolean;
  email: string;
  member?: Member;
}
```

### Member Object

```typescript
interface Member {
  id: number;
  active?: boolean;
  firstname: string;
  lastname: string;
  address1?: string;
  address2?: string;
  postalcode?: string;
  phone1?: string;
  phone2?: string;
  mobile?: string;
  email: string;
  password?: string;

  // Optional text fields (1-6)
  optional_textfield1?: string;
  optional_textfield2?: string;
  optional_textfield3?: string;
  optional_textfield4?: string;
  optional_textfield5?: string;
  optional_textfield6?: string;

  // Optional select fields (1-4) with labels
  optional_select1?: number;
  optional_select1_label?: string;
  optional_select2?: number;
  optional_select2_label?: string;
  optional_select3?: number;
  optional_select3_label?: string;
  optional_select4?: number;
  optional_select4_label?: string;

  // Optional date fields (1-2)
  optional_date1?: string; // ISO date string
  optional_date2?: string; // ISO date string

  // Optional checkbox fields (1-4)
  optional_checkbox1?: boolean;
  optional_checkbox2?: boolean;
  optional_checkbox3?: boolean;
  optional_checkbox4?: boolean;

  membertype?: MemberType;
}
```

### Additional Data Models

```typescript
interface MemberType {
  id: number;
  name: string;
  contingent?: number;
}

interface OptionalSelectValues {
  id: number;
  label: string;
  values: OptionalSelectValue[];
}

interface OptionalSelectValue {
  id: number;
  label: string;
}

interface UpdateResult {
  success: boolean;
  errors?: Record<string, string[]>;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}
```

## Development

### Prerequisites

- **Bun**: 1.0.0 or higher (recommended)
- TypeScript: 5.9.0 or higher

> **Note**: While the SDK works with Node.js 18+, we strongly recommend using Bun for development due to its superior performance, built-in TypeScript support, and faster package management.

### Setup

```bash
# Clone the repository
git clone https://github.com/regweb/regweb-api-js.git
cd regweb-api-js

# Install dependencies with Bun (recommended - much faster)
bun install

# Run type checking
bun run type-check

# Alternative with npm (slower)
# npm install && npm run type-check
```

### Build System

The project uses Rollup for building multiple output formats:

```bash
# Build the library (ESM + CommonJS + TypeScript declarations)
bun run build

# Development build with watch mode
bun run dev

# Alternative with npm (slower)
# npm run build && npm run dev
```

Build outputs:
- `dist/index.esm.js` - ES Module build with source maps
- `dist/index.js` - CommonJS build with source maps
- `dist/index.d.ts` - TypeScript declarations
- `dist/index.d.ts.map` - Declaration source maps

### Testing

```bash
# Run all tests with Bun (recommended - much faster)
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Alternative with Jest/npm (slower)
# npm run test:jest
```

Test configuration:
- **Primary**: Bun's built-in test runner (fast, native TypeScript support)
- **Alternative**: Jest with ts-jest (for compatibility)
- Environment: Bun runtime with ESM support
- Coverage: Automatic collection from `src/` directory
- Setup: Custom test setup in `tests/setup.ts`

### Code Quality

```bash
# Lint code (ESLint with TypeScript support)
bun run lint

# Fix linting issues automatically
bun run lint:fix

# Type checking without emitting files
bun run type-check

# Alternative with npm (slower)
# npm run lint && npm run lint:fix && npm run type-check
```

Linting configuration:
- ESLint: 9.33+ with TypeScript ESLint plugin
- Rules: Strict TypeScript rules with custom overrides
- Formatting: 4-space indentation, consistent style

### Publishing

```bash
# Prepare for publishing (runs build automatically)
bun run prepublishOnly

# Publish to npm (requires authentication)
bun run npm publish

# Alternative with npm
# npm run prepublishOnly && npm publish
```

## Architecture

### Core Components

- **`RegwebApi`** - Main API client class with all public methods
- **`AuthManager`** - OAuth2 token management and automatic refresh
- **`HttpClient`** - Axios-based HTTP client with error handling
- **`RegwebApiError`** - Custom error class for API-specific errors

### Design Principles

- **Type Safety**: Full TypeScript coverage with strict typing
- **Error Handling**: Comprehensive error types and handling strategies
- **Session Management**: Automatic token refresh and session persistence
- **Modern Standards**: ES2020+ features, ESM/CommonJS dual builds
- **Developer Experience**: IntelliSense support, detailed documentation

## Runtime Support

The SDK supports modern JavaScript runtimes and browsers:

- **Bun**: 1.0.0+ (recommended - fastest performance)
- Node.js: 18.0.0+ (legacy support)
- Browsers: Chrome 80+, Firefox 72+, Safari 13.1+, Edge 80+
- Module Systems: ESM, CommonJS, UMD (via bundlers)

> **Performance Note**: Bun provides significantly better performance for package installation, testing, and runtime execution compared to Node.js.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run the full test suite (`bun test`)
6. Lint your code (`bun run lint:fix`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Submit a pull request

### Development Guidelines

- Maintain 100% TypeScript coverage
- Add tests for all new features
- Follow existing code style and patterns
- Update documentation for API changes
- Ensure all CI checks pass

## Support

- Issues: [GitHub Issues](https://github.com/regweb/regweb-api-js/issues)
- Documentation: This README and inline code documentation
- Examples: See [`examples/`](examples/) directory
- Discussions: [GitHub Discussions](https://github.com/regweb/regweb-api-js/discussions)

## Changelog

See [GitHub Releases](https://github.com/regweb/regweb-api-js/releases) for version history and changes.
