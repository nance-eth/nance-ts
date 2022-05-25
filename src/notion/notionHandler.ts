import { Client as NotionClient } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import {
  QueryDatabaseParameters,
  UpdatePageParameters,
  UpdatePageResponse,
  GetDatabaseResponse,
  QueryDatabaseResponse
} from '@notionhq/client/build/src/api-endpoints';
import {
  DataContentHandler,
  NotionFilterName,
} from './notionTypes';
import { Proposal } from '../types';
import * as notionUtils from './notionUtils';

export class NotionHandler implements DataContentHandler {
  private notion;
  private notionToMd;

  constructor(
    private notionKey: string,
    private config: any
  ) {
    this.notion = new NotionClient({ auth: this.notionKey });
    this.notionToMd = new NotionToMarkdown({ notionClient: this.notion });
  }

  private toProposal(unconvertedProposal: GetDatabaseResponse): Proposal {
    return {
      hash: unconvertedProposal.id,
      title: notionUtils.getTitle(unconvertedProposal),
      url: notionUtils.getURL(unconvertedProposal),
      category: notionUtils.getCategory(unconvertedProposal),
      status: notionUtils.getStatus(unconvertedProposal),
      proposalId: notionUtils.getRichText(
        unconvertedProposal,
        this.config.notion.propertyKeys.proposalId
      ),
      discussionThreadURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.discussionThreadPropertyKey
      ),
      ipfsURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.notion.propertyKeys.ipfs
      )
    };
  }

  private async queryNotionDb(filters: any): Promise<Proposal[]> {
    const databaseReponse = await this.notion.databases.query(
      {
        database_id: this.config.notion.database_id,
        filter: filters
      } as QueryDatabaseParameters
    );
    return databaseReponse.results.map((data: any) => {
      return this.toProposal(data as GetDatabaseResponse);
    });
  }

  async getToDiscuss(): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.preDiscussion
    );
    return proposals;
  }

  async getDiscussionProposals(): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.discussion
    );
    return proposals;
  }

  async getTemperatureCheckProposals(): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.temperatureCheck
    );
    return proposals;
  }

  async getToVote(): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.voting
    );
    return proposals;
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
