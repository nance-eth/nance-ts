import { Request } from "express";
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

export async function addressFromHeader(req: Request): Promise<string | undefined> {
  const jwt = req?.headers?.authorization?.split("Bearer ")[1];
  if (!jwt) return undefined;

  try {
    const decoded = await decode({ token: jwt, secret: keys.NEXTAUTH_SECRET });
    const { sub, iat, exp } = decoded as unknown as DecodedJWT;
    const now = unixTimeStampNow();
    if (iat > now) throw new Error("JWT issued in the future");
    if (exp < now) throw new Error("JWT expired");
    return sub;
  } catch (e: any) {
    throw new Error(e);
  }
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
