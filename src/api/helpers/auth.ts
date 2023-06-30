import { decode } from 'next-auth/jwt';
import { unixTimeStampNow } from '../../utils';
import { keys } from '../../keys';

interface DecodedJWT {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

export async function addressFromJWT(jwt: string): Promise<string> {
  try {
    const decoded = await decode({ token: jwt, secret: keys.NEXTAUTH_SECRET });
    if (!decoded) return await Promise.reject(new Error('No decoded JWT'));
    const { sub, iat, exp } = decoded as unknown as DecodedJWT;
    const now = unixTimeStampNow();
    if (iat > now) return await Promise.reject(new Error('JWT issued in the future'));
    if (exp < now) return await Promise.reject(new Error('JWT expired'));
    return sub;
  } catch (e) {
    return Promise.reject(e);
  }
}
