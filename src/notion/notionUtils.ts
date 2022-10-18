import { SnapshotVoteOptions } from '../types';

const NOTION_URL_PREFIX = 'www.notion.so';

export const getTitle = (page:any) => {
  // notion api sometimes splits out the title into
  // multiple objects, map into single string separated by ' '
  return page.properties.Name.title.map((t:any) => {
    return t.plain_text;
  }).join(' ').trim();
};

export function getRichText(page:any, property:any): string {
  return page.properties[property].rich_text.map((t:any) => {
    return t.plain_text;
  }).join(' ').trim();
}

export function getNumber(page:any, property:any): number {
  return page.properties[property].number;
}

export function getFormula(page:any, property:any): string {
  return page.properties[property];
}

export const getType = (page:any) => {
  return page.properties.Category.multi_select.map((p:any) => {
    return p.name;
  }).join(' & ');
};

export const getURL = (page:any) => {
  return page.url;
};

export const getPublicURL = (page:any, publicUrlPrefix:any) => {
  return page.url.replace(NOTION_URL_PREFIX, publicUrlPrefix);
};

export const getStatus = (page:any) => {
  return page.properties.Status.select.name;
};

export const getVoteSetup = (page:any): SnapshotVoteOptions => {
  return {
    type: page.properties['Vote Type'].select?.name,
    choices: getRichText(page, 'Vote Choices').split(',')
  };
};

export const getPropertyURL = (page:any, property:any) => {
  return (page.properties[property]) ? page.properties[property].url : '';
};

export const getDate = (page:any) => {
  return (page.properties.Date.date) ? page.properties.Date.date.start : '';
};
