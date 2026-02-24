// app/_layout.js
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { closeDB, initDB } from '../src/database/db';
import { toastConfig } from '../src/ui/toast.js';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState('');

  const initializeDatabase = useCallback(async () => {
    try {
      setDbError('');
      setDbReady(false);
      await initDB();
      setDbReady(true);
      console.log('✅ Database initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setDbError(message || 'Database initialization failed');
      console.error('❌ Database initialization failed:', error);
    }
  }, []);

  useEffect(() => {
    initializeDatabase();

    // Cleanup on app close
    return () => {
      closeDB();
    };
  }, [initializeDatabase]);

  if (dbError && !dbReady) {
    return (
      <>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#333' }}>Database Error</Text>
          <Text style={{ textAlign: 'center', color: '#666', marginBottom: 18 }}>{dbError}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#E53935', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 8 }}
            onPress={initializeDatabase}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Toast config={toastConfig} />
      </>
    );
  }

  if (!dbReady) {
    return (
      <>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
        <Toast config={toastConfig} />
      </>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}
