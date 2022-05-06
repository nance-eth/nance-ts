import {
  UpdatePageParameters,
  UpdatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

export interface DataContentHandler {
  getToDiscuss(): Promise<any>;
  updateMetaData(
    pageId: UpdatePageParameters['page_id'],
    updateProperties: UpdatePageParameters['properties']
  ): Promise<UpdatePageResponse>;
}

export enum NotionFilterName {
  preDiscussion = 0,
  discussion = 1,
  proposalId = 2,
  temperatureCheck = 3,
  voting = 4,
}
