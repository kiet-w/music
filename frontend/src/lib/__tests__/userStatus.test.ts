import { describe, it, expect } from 'vitest';
import { getUserStatusText } from '../userStatus';

describe('userStatus utils', () => {
  it('returns Online status if isOnline is true', () => {
    const res = getUserStatusText(true);
    expect(res).toEqual({ text: 'Online', isOnline: true });
  });

  it('returns Offline if lastSeen is missing and isOnline is false', () => {
    const res = getUserStatusText(false, null);
    expect(res).toEqual({ text: 'Offline', isOnline: false });
  });

  it('formats recent lastSeen correctly', () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const res = getUserStatusText(false, tenMinutesAgo);
    expect(res.text).toBe('Hoạt động 10 phút trước');
    expect(res.isOnline).toBe(false);
  });
});
