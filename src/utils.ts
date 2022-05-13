export const sleep = (milliseconds: number) => {
  return new Promise((resolve) => { setTimeout(resolve, milliseconds); });
};

export function log(text: string, type = 'log') {
  if (type === 'log') {
    console.log(`${new Date().toISOString()}\t${text}`);
  } else if (type === 'err') {
    console.log('\x1b[31m%s\x1b[0m', `${new Date().toISOString()}\t${text}`);
  } else if (type === 'good') {
    console.log('\x1b[32m%s\x1b[0m', `${new Date().toISOString()}\t${text}`);
  }
}

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

export function addDaysToTimeStamp(timestamp: number, days: number) {
  return timestamp + Math.floor(days * 24 * 60 * 60);
}

export const minutesToDays = (minutes: number) => {
  return minutes / 24 / 60;
};

export function getLastSlash(url: string) {
  const split = url.split('/');
  return split[split.length - 1];
}

export function base64ToJSON(data: string) {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

export function base64ToString(data: string) {
  return Buffer.from(data, 'base64').toString();
}
