import { describe, it, expect } from 'vitest';
import { isPublicAuthRoute, getAuthRedirectPath } from '../useAuthGate';

describe('useAuthGate route protection', () => {
  describe('isPublicAuthRoute', () => {
    it('treats login, register, forgot-password, password-reset as public', () => {
      expect(isPublicAuthRoute('/vi/login')).toBe(true);
      expect(isPublicAuthRoute('/en/login')).toBe(true);
      expect(isPublicAuthRoute('/vi/register')).toBe(true);
      expect(isPublicAuthRoute('/vi/forgot-password')).toBe(true);
      expect(isPublicAuthRoute('/vi/password-reset')).toBe(true);
      expect(isPublicAuthRoute('/vi/invite/token123')).toBe(true);
      expect(isPublicAuthRoute('/vi/auth/callback/google')).toBe(true);
      expect(isPublicAuthRoute('/')).toBe(true);
      expect(isPublicAuthRoute('/index.html')).toBe(true);
    });

    it('treats home page and protected app routes as NOT public', () => {
      // Home page: /[locale]
      expect(isPublicAuthRoute('/vi')).toBe(false);
      expect(isPublicAuthRoute('/en')).toBe(false);
      expect(isPublicAuthRoute('/vi/')).toBe(false);

      // App protected routes
      expect(isPublicAuthRoute('/vi/albums')).toBe(false);
      expect(isPublicAuthRoute('/vi/music')).toBe(false);
      expect(isPublicAuthRoute('/vi/messages')).toBe(false);
      expect(isPublicAuthRoute('/vi/user')).toBe(false);
      expect(isPublicAuthRoute('/vi/youtube')).toBe(false);
    });
  });

  describe('getAuthRedirectPath', () => {
    it('returns null if not yet hydrated', () => {
      const redirect = getAuthRedirectPath({
        pathname: '/vi',
        accessToken: null,
        isHydrated: false,
        locale: 'vi',
      });
      expect(redirect).toBeNull();
    });

    it('redirects unauthenticated users from protected routes to login', () => {
      // Home page redirect
      expect(
        getAuthRedirectPath({
          pathname: '/vi',
          accessToken: null,
          isHydrated: true,
          locale: 'vi',
        })
      ).toBe('/vi/login');

      // Albums redirect
      expect(
        getAuthRedirectPath({
          pathname: '/vi/albums',
          accessToken: null,
          isHydrated: true,
          locale: 'vi',
        })
      ).toBe('/vi/login');

      // English locale redirect
      expect(
        getAuthRedirectPath({
          pathname: '/en/music',
          accessToken: null,
          isHydrated: true,
          locale: 'en',
        })
      ).toBe('/en/login');
    });

    it('does not redirect unauthenticated users when on public routes', () => {
      expect(
        getAuthRedirectPath({
          pathname: '/vi/login',
          accessToken: null,
          isHydrated: true,
          locale: 'vi',
        })
      ).toBeNull();

      expect(
        getAuthRedirectPath({
          pathname: '/vi/register',
          accessToken: null,
          isHydrated: true,
          locale: 'vi',
        })
      ).toBeNull();

      expect(
        getAuthRedirectPath({
          pathname: '/vi/invite/friend123',
          accessToken: null,
          isHydrated: true,
          locale: 'vi',
        })
      ).toBeNull();
    });

    it('redirects authenticated users away from login/register to albums', () => {
      expect(
        getAuthRedirectPath({
          pathname: '/vi/login',
          accessToken: 'valid_jwt_token',
          isHydrated: true,
          locale: 'vi',
        })
      ).toBe('/vi/albums');

      expect(
        getAuthRedirectPath({
          pathname: '/vi/register',
          accessToken: 'valid_jwt_token',
          isHydrated: true,
          locale: 'vi',
        })
      ).toBe('/vi/albums');
    });

    it('does not redirect authenticated users on protected pages', () => {
      expect(
        getAuthRedirectPath({
          pathname: '/vi',
          accessToken: 'valid_jwt_token',
          isHydrated: true,
          locale: 'vi',
        })
      ).toBeNull();

      expect(
        getAuthRedirectPath({
          pathname: '/vi/albums',
          accessToken: 'valid_jwt_token',
          isHydrated: true,
          locale: 'vi',
        })
      ).toBeNull();

      expect(
        getAuthRedirectPath({
          pathname: '/vi/music',
          accessToken: 'valid_jwt_token',
          isHydrated: true,
          locale: 'vi',
        })
      ).toBeNull();
    });
  });
});
