import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export function useAuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)';

    if (!user || !accessToken) {
      if (inProtectedGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (inAuthGroup) {
        router.replace('/(tabs)/');
      }
    }
  }, [user, accessToken, isHydrated, segments, router]);

  return { isHydrated };
}
