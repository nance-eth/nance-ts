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
    date.getUTCMinutes(),
    date.getUTCSeconds()
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

export function stringToBase64(data: string) {
  return Buffer.from(data).toString('base64');
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

export function numToPrettyString(num: number | undefined) {
  if (num === undefined) {
    return '';
  } if (num === 0) {
    return 0;
  } if (num > 1E9) {
    return `${(num / 1E9).toFixed(1)}B`;
  } if (num > 1E6) {
    return `${(num / 1E6).toFixed(1)}M`;
  } if (num > 1E3) {
    return `${(num / 1E3).toFixed(1)}k`;
  }
  return num.toFixed(1);
}

export function omitKey(object: object, key: string) {
  const { [key as keyof object]: unused, ...newObject } = object;
  return newObject;
}
