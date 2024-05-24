import { decode } from "next-auth/jwt";
import { recoverTypedDataAddress } from "viem";
import {
  BasicNanceSignature,
  NanceSignaturePrimaryTypesMap,
  NanceSignatureTypesMap,
  domain
} from "@nance/nance-sdk";
import { unixTimeStampNow } from "../../utils";
import { keys } from "../../keys";
import { getAddressRoles } from "../../guildxyz/guildxyz";

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
  console.log("addressFromSignature: INPUT", message, signature);
  try {
    const address = await recoverTypedDataAddress({
      types: NanceSignatureTypesMap[type] as any,
      domain,
      primaryType: NanceSignaturePrimaryTypesMap[type] as any,
      message: message as any,
      signature: signature as `0x${string}`,
    });
    console.log("addressFromSignature: OUTPUT", address);
    return address;
  } catch (e: any) {
    return Promise.reject(e.message);
  }
}

export const addressHasGuildRole = async (address: string, guildId: number, roleId: number[]) => {
  const access = await getAddressRoles(address, guildId);
  const rolesAccess = access.map((a) => a.access);
  return rolesAccess.includes(true);
};
