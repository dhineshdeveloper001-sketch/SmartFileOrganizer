import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = process.env.AUTH_SECRET || 'bXktc3VwZXItc2VjcmV0LWtleS10aGF0LWlzLWF0LWxlYXN0LTMyLWNoYXJzLWxvbmc=';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const TOKEN_NAME = 'sfo_token';
const EXPIRES_IN = process.env.AUTH_EXPIRES_IN || '7d';

export interface TokenPayload {
  id: number;
  username: string;
  role: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

/**
 * Hash a plain text password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plain text password with a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token containing user id, username, and role.
 */
export async function generateToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secretKey);
}

/**
 * Verify and decode a JWT token.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: Number(payload.id),
      username: String(payload.username),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

/**
 * Extract token from either the Authorization header or the HttpOnly cookie.
 */
export async function extractToken(req?: Request): Promise<string | null> {
  // 1. Try Authorization: Bearer <token>
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    // 2. Try cookie from request header
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${TOKEN_NAME}=([^;]*)`));
      if (match) return decodeURIComponent(match[1]);
    }
  }

  // 3. Fallback to next/headers cookies if in Server Component / Route Handler context
  try {
    const cookieStore = await cookies();
    return cookieStore.get(TOKEN_NAME)?.value || null;
  } catch {
    return null;
  }
}

/**
 * Get verified authenticated user from database.
 */
export async function getCurrentUser(req?: Request): Promise<AuthUser | null> {
  const token = await extractToken(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: BigInt(payload.id) },
    select: { id: true, username: true, role: true },
  });

  if (!user) return null;

  return {
    id: Number(user.id),
    username: user.username,
    role: user.role,
  };
}

/**
 * Require authenticated user. Returns user or null.
 */
export async function requireAuth(req?: Request): Promise<AuthUser | null> {
  return getCurrentUser(req);
}

/**
 * Require user with ROLE_ADMIN. Returns user or null.
 */
export async function requireAdmin(req?: Request): Promise<AuthUser | null> {
  const user = await getCurrentUser(req);
  if (!user || user.role !== 'ROLE_ADMIN') {
    return null;
  }
  return user;
}

export { TOKEN_NAME };
