import { NanceConfig, SnapshotVoteOptions } from '../types';
import { SimplePropertyFilter } from './notionTypes';

const NOTION_URL_PREFIX = 'www.notion.so';
const uuidRegex = /[^-]([a-zA-Z0-9]*[a-zA-Z0-9])$/;

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
  const choicesParsed = getRichText(page, 'Vote Choices').split(',').map((entry) => { return entry.trim(); });
  const choices = (choicesParsed[0] !== '') ? choicesParsed : undefined;
  return {
    type: page.properties['Vote Type'].select?.name,
    choices
  };
};

export const getPropertyURL = (page:any, property:any) => {
  return (page.properties[property]) ? page.properties[property].url : '';
};

export const getDate = (page:any) => {
  return (page.properties.Date.date) ? page.properties.Date.date.start : '';
};

export const filters = (config: NanceConfig) => {
  return {
    preDiscussion: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Discussion',
          },
        },
        {
          property: config.propertyKeys.discussionThread,
          url: {
            is_empty: true,
          }
        },
        {
          property: 'Name',
          title: {
            is_not_empty: true
          }
        }],
    },
    discussion: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Discussion',
          },
        },
        {
          property: config.propertyKeys.discussionThread,
          url: {
            is_not_empty: true,
          },
        },
        {
          property: 'Name',
          title: {
            is_not_empty: true
          }
        }],
    },
    proposalId: {
      property: config.propertyKeys.proposalId,
      rich_text: {
        contains: config.propertyKeys.proposalIdPrefix,
      }
    },
    temperatureCheck: {
      property: 'Status',
      select: {
        equals: 'Temperature Check',
      }
    },

    voting: {
      property: 'Status',
      select: {
        equals: 'Voting',
      }
    },
    approvedRecurringPayment: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Approved',
          }
        },
        {
          property: config.propertyKeys.type,
          multi_select: {
            contains: config.propertyKeys.typeRecurringPayout
          }
        }
      ] as SimplePropertyFilter[]
    },
    payoutsV1: {
      and: [
        {
          property: 'JB DAO Treasury',
          rich_text: {
            contains: 'V1'
          }
        },
        {
          property: config.propertyKeys.payoutAddress,
          rich_text: {
            is_not_empty: true
          }
        }
      ]
    },
    payoutsV2: {
      and: [
        {
          property: 'JB DAO Treasury',
          rich_text: {
            contains: 'V2'
          }
        },
        {
          property: config.propertyKeys.payoutAddress,
          rich_text: {
            is_not_empty: true
          }
        }
      ]
    },
    reservedIsNotOwner: {
      property: 'isOwner',
      rich_text: {
        contains: 'false'
      }
    }
  };
};
