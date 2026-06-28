import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error(
    'JWT_SECRET environment variable is required. Set it in .env.local for development or in your production environment.'
  );
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getUserFromSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload) return null;

    if (payload.tokenVersion !== undefined) {
      await dbConnect();
      const user = await User.findById(payload.id).select('tokenVersion').lean();
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}
