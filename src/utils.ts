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

export function dateToArray(date: Date) {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  ];
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

export function getLastSlash(url: string) {
  const split = url.split('/');
  return split[split.length - 1].trim();
}

export function base64ToJSON(data: string) {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

export function base64ToString(data: string) {
  return Buffer.from(data, 'base64').toString();
}

export function floatToPercentage(float: number) {
  return (float * 100).toFixed(2);
}
