import { createHmac, timingSafeEqual } from 'crypto';
import type { IncomingMessage } from 'http';

const AUTH_TOKEN_MIN_LENGTH = 32;
const SESSION_COOKIE_NAME = 'fitbuddy_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function getAuthToken(): string | null {
  const token = process.env.FITBUDDY_AUTH_TOKEN?.trim();
  return token && token.length >= AUTH_TOKEN_MIN_LENGTH ? token : null;
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function createSignature(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function getCookieValue(cookieHeader: string | undefined, cookieName: string): string | null {
  const prefix = `${cookieName}=`;
  const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}

function isValidSessionToken(token: string, secret: string): boolean {
  const [expiresAtValue, signature, extra] = token.split('.');
  const expiresAt = Number(expiresAtValue);
  if (!expiresAtValue || !signature || extra !== undefined || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  return secureCompare(signature, createSignature(expiresAtValue, secret));
}

export function isAuthConfigured(): boolean {
  return getAuthToken() !== null;
}

export function verifyAuthToken(candidate: unknown): boolean {
  const secret = getAuthToken();
  return typeof candidate === 'string' && secret !== null && secureCompare(candidate.trim(), secret);
}

export function createSessionToken(): string {
  const secret = getAuthToken();
  if (!secret) throw new Error('FITBUDDY_AUTH_TOKEN must contain at least 32 characters.');

  const expiresAt = String(Date.now() + SESSION_DURATION_MS);
  return `${expiresAt}.${createSignature(expiresAt, secret)}`;
}

export function isAuthenticatedRequest(request: Pick<IncomingMessage, 'headers'>): boolean {
  const secret = getAuthToken();
  if (!secret) return false;

  const authorization = request.headers.authorization;
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch && secureCompare(bearerMatch[1].trim(), secret)) return true;

  const sessionToken = getCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);
  return sessionToken !== null && isValidSessionToken(sessionToken, secret);
}