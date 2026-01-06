# Expo Mobile App Integration with Serverless Wrapper

Complete guide for integrating the Regweb API into an Expo/React Native app using the secure serverless wrapper.

## Overview

This setup ensures:
- ✅ No OAuth secrets in mobile app code
- ✅ Simple Bearer token authentication
- ✅ Session persistence across app restarts
- ✅ Automatic token refresh handling

## Step 1: Deploy the Wrapper

### Using Cloudflare Workers (Recommended)

```bash
# Install Wrangler
bun add -g wrangler

# Login to Cloudflare
wrangler login

# Clone and deploy
cd wrapper
wrangler deploy

# Set secrets
wrangler secret put REGWEB_BASE_URL    # https://your-regweb.com
wrangler secret put REGWEB_CLIENT_ID   # your-client-id
wrangler secret put REGWEB_CLIENT_SECRET # your-secret
wrangler secret put API_KEYS           # api-key-1,api-key-2
```

Your wrapper is now live at `https://regweb-auth-proxy.<account>.workers.dev`

## Step 2: Create Auth Hook for Expo

```typescript
// hooks/useRegwebAuth.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegwebProxyClient, User } from '@unnamed-nic/regweb-api-js/proxy-client';

const client = new RegwebProxyClient({
  proxyUrl: 'https://regweb-auth-proxy.your-account.workers.dev',
  apiKey: 'your-api-key', // Safe to embed - not the OAuth secret
});

export function useRegwebAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore tokens on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('regweb_tokens');
      if (stored) {
        client.setTokens(JSON.parse(stored));
        try {
          const userData = await client.getUser();
          setUser(userData);
        } catch {
          await AsyncStorage.removeItem('regweb_tokens');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    await client.login(username, password);
    await AsyncStorage.setItem('regweb_tokens', JSON.stringify(client.getTokens()));
    const userData = await client.getUser();
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    client.logout();
    await AsyncStorage.removeItem('regweb_tokens');
    setUser(null);
  }, []);

  return { user, loading, login, logout, client };
}
```

## Step 3: Login Screen

```tsx
// screens/LoginScreen.tsx
import { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import { useRegwebAuth } from '../hooks/useRegwebAuth';

export function LoginScreen({ navigation }) {
  const { login } = useRegwebAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigation.replace('Home');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

## Step 4: Protected Screen

```tsx
// screens/ProfileScreen.tsx
import { View, Text, Button } from 'react-native';
import { useRegwebAuth } from '../hooks/useRegwebAuth';

export function ProfileScreen() {
  const { user, logout } = useRegwebAuth();

  if (!user) return null;

  return (
    <View style={{ padding: 20 }}>
      <Text>Welcome, {user.firstname} {user.lastname}</Text>
      <Text>Email: {user.email}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## Environment Configuration

For different environments, use Expo's environment variables:

```typescript
// config.ts
const config = {
  wrapperUrl: process.env.EXPO_PUBLIC_REGWEB_WRAPPER_URL,
  apiKey: process.env.EXPO_PUBLIC_REGWEB_API_KEY,
};
```

```bash
# .env.development
EXPO_PUBLIC_REGWEB_WRAPPER_URL=https://regweb-auth-proxy-dev.workers.dev
EXPO_PUBLIC_REGWEB_API_KEY=dev-api-key

# .env.production
EXPO_PUBLIC_REGWEB_WRAPPER_URL=https://regweb-auth-proxy.workers.dev
EXPO_PUBLIC_REGWEB_API_KEY=prod-api-key
```

## Security Best Practices

1. **Rotate API keys** between app versions
2. **Use different API keys** for dev/staging/production
3. **Monitor usage** in Cloudflare dashboard
4. **Enable rate limiting** for production deployments

