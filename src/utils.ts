/* eslint-disable no-param-reassign */
import axios from "axios";
import fs from "fs";
import path from "path";
import { cloneDeepWith, merge } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { JsonRpcProvider } from "@ethersproject/providers";
import { NanceConfig } from "@nance/nance-sdk";
import { Contract } from "ethers";
import { erc20Abi } from "viem";
import { keys } from "./keys";
import { NETWORKS } from "./constants";

const networkToRPC = {
  mainnet: `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`,
  1: `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`,
  [NETWORKS.GOERLI]: `https://goerli.infura.io/v3/${keys.INFURA_KEY}`,
  [NETWORKS.GNOSIS]: "https://rpc.ankr.com/gnosis",
  100: "https://rpc.ankr.com/gnosis",
  [NETWORKS.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${keys.INFURA_KEY}`,
  10: `https://optimism-mainnet.infura.io/v3/${keys.INFURA_KEY}`,
};

export const chainIdToExplorer = (chainId: number) => {
  if (chainId === 100) return "https://gnosisscan.io";
  if (chainId === 10) return "https://optimistic.etherscan.io";
  return "https://etherscan.io";
};

export const chainIdToExplorerApi = (chainId: number) => {
  if (chainId === 100) return "https://api.gnosisscan.io";
  if (chainId === 10) return "https://api-optimistic.etherscan.io";
  return "https://api.etherscan.io";
};

export const networkNameToChainId = (network: string) => {
  if (network === "mainnet") return 1;
  if (network === "gnosis") return 100;
  if (network === "optimism") return 10;
  return 1;
};

export const myProvider = (network = "mainnet") => {
  const RPC_HOST = networkToRPC[network];
  return new JsonRpcProvider(RPC_HOST);
};

export const IPFS_GATEWAY = "https://nance.infura-ipfs.io";
export const DEFAULT_SPACE_AVATAR = "QmahthKcytRxATnMyrUWyAmnDaBqpFcXkyJabWeEFae5Xs";

export const sleep = (milliseconds: number) => {
  return new Promise((resolve) => { setTimeout(resolve, milliseconds); });
};

export function addDaysToDate(date: Date, days: number) {
  return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
}

export const dateToUnixTimeStamp = (date: Date) => {
  return Math.floor(date.getTime() / 1000);
};

export function unixTimeStampNow() {
  return dateToUnixTimeStamp(new Date());
}

export function formatUTCTime(date: Date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

export function dateToArray(date: Date): [number, number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ];
}

export function addDaysToDateArray(dateArray: [number, number, number, number, number, number], days: number) {
  const date = new Date(Date.UTC(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4], dateArray[5]));
  return dateToArray(new Date(date.getTime() + (days * 24 * 60 * 60 * 1000)));
}

export function addDaysToTimeStamp(timestamp: number, days: number) {
  return timestamp + Math.floor(days * 24 * 60 * 60);
}

export function addSecondsToDate(date: Date, seconds: number) {
  return new Date(date.getTime() + (seconds * 1000));
}

export const minutesToDays = (minutes: number) => {
  return minutes / 24 / 60;
};

export const dateAtTime = (date: Date, time: string) => {
  const [hour, minute, seconds] = time.split(":");
  date.setUTCHours(Number(hour));
  date.setUTCMinutes(Number(minute));
  date.setUTCSeconds(Number(seconds));
  date.setUTCMilliseconds(0);
  return date;
};

export const mySQLTimeToUTC = (date: Date) => {
  return new Date(`${date} UTC`);
};

export function getLastSlash(url: string) {
  if (!url) return "";
  if (!url.includes("/")) return url;
  const split = url.split("/");
  return split[split.length - 1].trim();
}

export function base64ToJSON(data: string) {
  return JSON.parse(Buffer.from(data, "base64").toString());
}

export function base64ToString(data: string) {
  return Buffer.from(data, "base64").toString();
}

export function stringToBase64(data: string) {
  return Buffer.from(data).toString("base64");
}

export function floatToPercentage(float: number) {
  return (float * 100).toFixed(2);
}

export function limitLength(text: string, length = 100) {
  if (text.length > length) {
    return text.substring(0, length);
  }
  return text;
}

export function numToPrettyString(
  num: number | string | undefined,
  precision: number | "auto" = 2
): string {
  if (num === undefined) return "";

  const value = Number(num);
  if (value === 0) return "0";

  let decimals = typeof precision === "number" ? precision : 0;
  if (precision === "auto") {
    const stringNum = String(num);
    decimals = stringNum.includes(".")
      ? stringNum.split(".")[1].replace(/0+$/, "").length
      : 0;
  }

  const format = (n: number, divisor: number, suffix: string) => `${(n / divisor).toFixed(decimals)}${suffix}`;

  if (value >= 1E9) return format(value, 1E9, "B");
  if (value >= 1E6) return format(value, 1E6, "M");
  if (value >= 1E3) return format(value, 1E3, "k");

  return value.toFixed(decimals);
}

export function omitKey(object: object, key: string): Partial<typeof object> {
  const { [key as keyof object]: unused, ...newObject } = object;
  return newObject;
}

export async function getReminderImages(baseURL: string, day: number) {
  const thumbnail = await axios({
    method: "get",
    url: `${baseURL}/${day}_thumbnail.png`,
    responseType: "arraybuffer"
  }).then((res) => {
    return res.data;
  });
  const image = await axios({
    method: "get",
    url: `${baseURL}/${day}.png`,
    responseType: "arraybuffer"
  }).then((res) => {
    return res.data;
  });
  return { thumbnail, image };
}

export function uuidGen(): string {
  return uuidv4().replaceAll("-", "");
}

export function cidToLink(cid: string, gateway: string) {
  return (cid.startsWith("Qm") ? `${gateway}/ipfs/${cid}` : `https://${cid}.${gateway}`);
}

export function sqlSchemaToString(): string[] {
  return fs.readFileSync(`${path.join(__dirname, "../assets/schema.sql")}`, "utf-8").split(";");
}

export function mergeConfig(configOld: NanceConfig, configNew: Partial<NanceConfig>): NanceConfig {
  return merge(configOld, configNew) as NanceConfig;
}

export function fetchTemplateCalendar() {
  return fs.readFileSync(`${path.join(__dirname, "./config/template/template.ics")}`, "utf-8");
}

export function isHexString(text: string) {
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(text);
}

export function maybePlural(text: string, count: number) {
  return count === 1 ? text : `${text}s`;
}

export const numberWithCommas = (x: number | string) => {
  return Number(x).toLocaleString();
};

export function deepStringify(obj: object): object {
  return cloneDeepWith(obj, (value) => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.map((item) => deepStringify(item));
      }
      return undefined;
    }
    return String(value);
  });
}

export const getContractName = async (address: string, chainId = 1) => {
  const api = chainIdToExplorerApi(chainId);
  try {
    const res = await axios.get(`${api}/api?module=contract&action=getsourcecode&address=${address}&apikey=${keys.ETHERSCAN_KEY}`);
    if (res.data.message === "NOTOK") {
      console.log(res.data.result);
      return address;
    }
    return res.data.result[0].ContractName;
  } catch (e) {
    console.log(e);
    return address;
  }
};

export const getTokenSymbol = async (address: string, chainId = 1) => {
  try {
    const provider = myProvider(String(chainId));
    const contract = new Contract(address, erc20Abi, provider);
    const symbol = await contract.symbol();
    return symbol;
  } catch (e) {
    return address;
  }
};
