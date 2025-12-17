# Expo 54 Authentication Example

This guide shows how to implement authentication using `regweb-api-js` in an Expo 54 app with the file-based router (Expo Router).

## Installation

```bash
npx expo install regweb-api-js expo-secure-store
```

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
└── auth.tsx             # Auth context and API client
```

## 1. Auth Context (`lib/auth.tsx`)

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RegwebApi, User, AuthResponse } from 'regweb-api-js';
import * as SecureStore from 'expo-secure-store';

const api = new RegwebApi({
  baseUrl: 'https://your-regweb-instance.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
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
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const expiresAt = await SecureStore.getItemAsync('expiresAt');

      if (accessToken && refreshToken && expiresAt) {
        api.restoreSession(accessToken, refreshToken, new Date(expiresAt));
        const userData = await api.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.log('Session restore failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const authResponse = await api.login(username, password);
    const tokenInfo = api.getTokenInfo();

    await SecureStore.setItemAsync('accessToken', tokenInfo.accessToken!);
    await SecureStore.setItemAsync('refreshToken', tokenInfo.refreshToken!);
    await SecureStore.setItemAsync('expiresAt', tokenInfo.expiresAt!.toISOString());

    const userData = await api.getUser();
    setUser(userData);
  }

  async function logout() {
    api.logout();
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('expiresAt');
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

export { api };
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

