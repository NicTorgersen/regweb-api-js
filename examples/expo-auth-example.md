# Expo 54 Authentication Example

This guide shows how to implement secure authentication in an Expo 54 app using the **Regweb Proxy Client**. This approach keeps OAuth secrets server-side while your mobile app uses a simple API key.

## Architecture

```
┌─────────────────┐     API Key        ┌──────────────────┐     OAuth2      ┌─────────────┐
│   Expo App      │ ────────────────▶  │ Cloudflare Proxy │ ─────────────▶  │  Regweb API │
└─────────────────┘                    └──────────────────┘                 └─────────────┘
```

**Why use the proxy?**
- ✅ No `clientId`/`clientSecret` in your mobile app
- ✅ Simple API key authentication
- ✅ Zero cold starts (Cloudflare Workers)
- ✅ Free tier: 100k requests/day

## Prerequisites

1. Deploy the proxy first - see [docs/serverless-wrapper.md](../docs/serverless-wrapper.md)
2. Have your proxy URL and API key ready

## Installation

```bash
npx expo install expo-secure-store
```

Copy `src/proxy-client.ts` to your Expo project's `lib/` folder.

## Project Structure

```
app/
├── _layout.tsx          # Root layout with auth context
├── (auth)/
│   ├── _layout.tsx      # Auth group layout
│   └── login.tsx        # Login screen
└── (app)/
    ├── _layout.tsx      # Protected app layout
    └── index.tsx        # Home screen (protected)
lib/
├── auth.tsx             # Auth context
└── proxy-client.ts      # Regweb proxy client (copy from SDK)
```

## 1. Auth Context (`lib/auth.tsx`)

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { RegwebProxyClient, User, Tokens } from './proxy-client';

// Configure the proxy client - API key is safe to embed (not the OAuth secret)
const client = new RegwebProxyClient({
  proxyUrl: process.env.EXPO_PUBLIC_REGWEB_PROXY_URL!,
  apiKey: process.env.EXPO_PUBLIC_REGWEB_API_KEY!,
});

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const stored = await SecureStore.getItemAsync('regweb_tokens');
      if (stored) {
        const tokens: Tokens = JSON.parse(stored);
        client.setTokens(tokens);

        // Verify tokens are still valid
        if (client.isLoggedIn()) {
          const userData = await client.getUser();
          setUser(userData);
        } else {
          // Try to refresh
          await client.refreshToken();
          await saveTokens();
          const userData = await client.getUser();
          setUser(userData);
        }
      }
    } catch (error) {
      console.log('Session restore failed:', error);
      await SecureStore.deleteItemAsync('regweb_tokens');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveTokens() {
    const tokens = client.getTokens();
    if (tokens) {
      await SecureStore.setItemAsync('regweb_tokens', JSON.stringify(tokens));
    }
  }

  async function login(username: string, password: string) {
    await client.login(username, password);
    await saveTokens();
    const userData = await client.getUser();
    setUser(userData);
  }

  async function logout() {
    client.logout();
    await SecureStore.deleteItemAsync('regweb_tokens');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export { client };
```

## 2. Root Layout (`app/_layout.tsx`)

```tsx
import { Slot } from 'expo-router';
import { AuthProvider } from '../lib/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
```

## 3. Auth Group Layout (`app/(auth)/_layout.tsx`)

```tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) return <Redirect href="/(app)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

## 4. Login Screen (`app/(auth)/login.tsx`)

```tsx
import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      setError('');
      await login(username, password);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  }

  return (
    <View style={styles.container}>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 8 },
  error: { color: 'red', marginBottom: 12 },
});
```

## 5. Protected App Layout (`app/(app)/_layout.tsx`)

```tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return <Stack />;
}
```

## 6. Home Screen (`app/(app)/index.tsx`)

```tsx
import { View, Text, Button } from 'react-native';
import { useAuth } from '../../lib/auth';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome, {user?.firstname} {user?.lastname}!</Text>
      <Text>{user?.email}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## 7. Environment Variables

Create `.env` files for your environments:

```bash
# .env.development
EXPO_PUBLIC_REGWEB_PROXY_URL=https://regweb-auth-proxy-dev.workers.dev
EXPO_PUBLIC_REGWEB_API_KEY=your-dev-api-key

# .env.production
EXPO_PUBLIC_REGWEB_PROXY_URL=https://regweb-auth-proxy.workers.dev
EXPO_PUBLIC_REGWEB_API_KEY=your-prod-api-key
```

## Security Notes

1. **API keys are safe to embed** - they only authenticate with your proxy, not with Regweb directly
2. **OAuth secrets stay server-side** - `clientId` and `clientSecret` are only in your Cloudflare Worker
3. **Use different API keys** for dev/staging/production environments
4. **Rotate API keys** periodically and between app versions
5. **Tokens are stored securely** using `expo-secure-store` (Keychain on iOS, Keystore on Android)

