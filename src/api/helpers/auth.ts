import { decode } from "next-auth/jwt";
import { recoverTypedDataAddress } from "viem";
import {
  BasicNanceSignature,
  nanceSignatureMap,
  domain,
} from "@nance/nance-sdk";
import { unixTimeStampNow } from "../../utils";
import { keys } from "../../keys";

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
    if (iat > now) return Promise.reject(new Error("JWT issued in the future"));
    if (exp < now) return Promise.reject(new Error("JWT expired"));
    return sub;
  }).catch((e) => {
    return Promise.reject(e);
  });
}

export async function addressFromSignature(
  { type, signature, message }: BasicNanceSignature
): Promise<string> {
  if (!signature.startsWith("0x")) return Promise.reject(new Error("Invalid signature"));
  console.log("addressFromSignature: INPUT", message, signature);
  try {
    const { primaryType, types } = nanceSignatureMap[type];
    const address = await recoverTypedDataAddress({
      types,
      domain,
      primaryType,
      message: message as Record<string, unknown>,
      signature: signature as `0x${string}`,
    });
    console.log("addressFromSignature: OUTPUT", address);
    return address;
  } catch (e: any) {
    return Promise.reject(e.message);
  }
}
