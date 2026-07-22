'use client';

const INVITE_COOKIE_NAME = 'pending_invite_token';

/**
 * Stores pending invite token into browser cookie (valid for 24 hours)
 */
export function setInviteCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${INVITE_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

/**
 * Retrieves pending invite token from browser cookie
 */
export function getInviteCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + INVITE_COOKIE_NAME + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Clears pending invite token cookie after friendship is established
 */
export function clearInviteCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${INVITE_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
