import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/otp',
  '/api/auth/me',
  '/api/stories',
  '/api/writers',
];

const ADMIN_PATHS = ['/admin'];
const ADMIN_API_PREFIXES = ['/api/admin', '/api/stories/bulk', '/api/stories/*/approve', '/api/stories/*/reject'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/stories/') || pathname.startsWith('/writers/')) return true;
  return false;
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminPath(pathname: string): boolean {
  if (ADMIN_PATHS.includes(pathname)) return true;
  return ADMIN_API_PREFIXES.some((prefix) => {
    const escaped = prefix.replace(/\*/g, '[^/]+');
    return new RegExp(`^${escaped}`).test(pathname);
  });
}

async function getUserFromCookie(request: NextRequest): Promise<{ role: string } | null> {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { role: (payload.role as string) || 'user' };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('--- MIDDLEWARE pathname:', pathname);

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    const user = await getUserFromCookie(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isAdminPath(pathname) && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const user = await getUserFromCookie(request);

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath(pathname) && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
