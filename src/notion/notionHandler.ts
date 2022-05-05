import { Client as NotionClient } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import {
  QueryDatabaseParameters,
  UpdatePageParameters,
  UpdatePageResponse,
  GetDatabaseResponse
} from '@notionhq/client/build/src/api-endpoints';
import {
  NotionFilterName,
} from './notionTypes';
import { DataContentHandler } from '../types';

export class NotionHandler implements DataContentHandler {
  private notion;
  private notionToMd;

  constructor(
    private notionKey: string,
    private databaseId: string,
    private filters: any,
  ) {
    this.notion = new NotionClient({ auth: this.notionKey });
    this.notionToMd = new NotionToMarkdown({ notionClient: this.notion });
  }

  private async queryNotionDb(filters: any): Promise<any> {
    return this.notion.databases.query(
      {
        database_id: this.databaseId,
        filter: filters
      } as QueryDatabaseParameters
    );
  }

  async getToDiscuss(): Promise<GetDatabaseResponse[]> {
    try {
      const databaseReponse = await this.queryNotionDb(
        this.filters[NotionFilterName.preDiscussion]
      );
      return databaseReponse.results;
    } catch (error: any) {
      return error.code;
    }
  }

  async getToTemperatureCheck(): Promise<GetDatabaseResponse[]> {
    try {
      const databaseReponse = await this.queryNotionDb(
        this.filters[NotionFilterName.discussion]
      );
      return databaseReponse.results;
    } catch (error: any) {
      return error.code;
    }
  }

  async getToVote(): Promise<GetDatabaseResponse[]> {
    try {
      const databaseReponse = await this.queryNotionDb(
        this.filters[NotionFilterName.voting]
      );
      return databaseReponse.results;
    } catch (error: any) {
      return error.code;
    }
  }

  async updateMetaData(
    pageId: string,
    updateProperties: UpdatePageParameters['properties']
  ): Promise<UpdatePageResponse> {
    try {
      return await this.notion.pages.update({
        page_id: pageId,
        properties: updateProperties,
      });
    } catch (error: any) {
      return error.code;
    }
  }

  async getContentMarkdown(pageId: string): Promise<string> {
    const mdBlocks = await this.notionToMd.pageToMarkdown(pageId);
    const mdString = this.notionToMd.toMarkdownString(mdBlocks);
    return mdString;
  }
}
