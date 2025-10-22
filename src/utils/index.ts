import ObjectID from 'bson-objectid';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

export const USER_BLOCK_TIME_FOR_AUTH = 2;

export const objectId = () => new ObjectID().toString();
export const uuid = (): string => uuidv4();

export const getBucketName = (): string => {
  return 'aichatbot';
};

export const compareTwoDate = (date: Date): boolean => {
  return new Date(date) > new Date();
};

export const encodeEmail = (email: string) => {
  return email.slice(0, 3) + '******' + email.split('@')[1];
};

export function randomNumber() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const randomString = (() => {
  const gen = (min: number, max: number) =>
    max++ && [...Array(max - min)].map((_s, i) => String.fromCharCode(min + i));
  const sets = {
    num: gen(48, 57),
    alphaLower: gen(97, 122),
    alphaUpper: gen(65, 90),
    special: [],
  };

  function* iter(len: number, set: string[]) {
    if (set.length < 1) set = Object.values(sets).flat();
    for (let i = 0; i < len; i++) yield set[(Math.random() * set.length) | 0];
  }

  return Object.assign(
    (len: number, ...set: string[]) => [...iter(len, set.flat())].join(''),
    sets,
  );
})();

export const dateDiff = (date: any, date2 = new Date()): number => {
  const now = moment(date2);
  const end = moment(date);
  const duration = moment.duration(end.diff(now));
  return ~~duration.asMinutes();
};

export const expireTime = (minutes = 10) => {
  const date = new Date();
  const m = date.getMinutes() + minutes;
  date.setMinutes(m);
  return date;
};
