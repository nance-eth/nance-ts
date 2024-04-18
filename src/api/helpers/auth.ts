import { decode } from "next-auth/jwt";
import {
  signatureTypes,
  signatureDomain,
  NewProposal,
  UpdateProposal,
  SignatureTypes,
} from "@nance/nance-sdk";
import { recoverTypedDataAddress } from "viem";
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
  message: NewProposal | UpdateProposal | { uuid: string },
  signature: string,
  primaryType: SignatureTypes
): Promise<string> {
  console.log("addressFromSignature", message, signature, primaryType);
  if (!message?.uuid) return Promise.reject(new Error("Proposal uuid is required"));

  const address = await recoverTypedDataAddress({
    types: signatureTypes,
    domain: signatureDomain,
    primaryType,
    message,
    signature: signature as `0x${string}`,
  });
  console.log("addressFromSignature", address);
  return address;
}

export const addressHasGuildRole = async (address: string, guildId: number, roleId: number[]) => {
  const access = await getAddressRoles(address, guildId);
  const rolesAccess = access.map((a) => a.access);
  return rolesAccess.includes(true);
};
