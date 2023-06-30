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
  return decode({ token: jwt, secret: keys.NEXTAUTH_SECRET }).then(async (decoded) => {
    const { sub, iat, exp } = decoded as unknown as DecodedJWT;
    const now = unixTimeStampNow();
    if (iat > now) return Promise.reject(new Error('JWT issued in the future'));
    if (exp < now) return Promise.reject(new Error('JWT expired'));
    return sub;
  }).catch((e) => {
    return Promise.reject(e);
  });
}
