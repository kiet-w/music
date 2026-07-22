import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, getEffectiveAccessToken } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(async () => {
    await useAuthStore.getState().clearSession();
  });

  it('initializes with null user and token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('sets session correctly and resolves getEffectiveAccessToken', async () => {
    const mockUser = { id: 'usr_1', email: 'test@example.com', name: 'Tester' };
    await useAuthStore.getState().setSession('jwt_token_123', mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('jwt_token_123');
    expect(state.user).toEqual(mockUser);

    expect(getEffectiveAccessToken()).toBe('jwt_token_123');
  });

  it('clears session correctly', async () => {
    const mockUser = { id: 'usr_1', email: 'test@example.com' };
    await useAuthStore.getState().setSession('jwt_token_123', mockUser);
    await useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(getEffectiveAccessToken()).toBeNull();
  });
});
