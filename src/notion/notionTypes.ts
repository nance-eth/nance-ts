import {
  UpdatePageParameters,
  UpdatePageResponse
} from '@notionhq/client/build/src/api-endpoints';

export interface DataContentHandler {
  getToDiscuss(): Promise<any>;
  updateMetaData(
    pageId: UpdatePageParameters['page_id'],
    updateProperties: UpdatePageParameters['properties']
  ): Promise<UpdatePageResponse>;
}

export type SimplePropertyFilter =
{
  property: string;
  rich_text: {
    equals: string;
  }
} | {
  property: string;
  multi_select: {
    contains: string;
  }
} | {
  property: string;
  select: {
    equals: string;
  }
};
