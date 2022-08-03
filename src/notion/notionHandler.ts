/* eslint-disable no-param-reassign */
import { Client as NotionClient } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import {
  QueryDatabaseParameters,
  UpdatePageParameters,
  UpdatePageResponse,
  GetDatabaseResponse,
  GetPageResponse,
  QueryDatabaseResponse
} from '@notionhq/client/build/src/api-endpoints';
import {
  DataContentHandler
} from './notionTypes';
import { Proposal } from '../types';
import * as notionUtils from './notionUtils';
import logger from '../logging';

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

  private toProposal(unconvertedProposal: GetDatabaseResponse | GetPageResponse): Proposal {
    return {
      hash: unconvertedProposal.id.replaceAll('-', ''),
      title: notionUtils.getTitle(unconvertedProposal),
      url: notionUtils.getPublicURL(unconvertedProposal, this.config.notion.publicURLPrefix),
      category: notionUtils.getCategory(unconvertedProposal),
      status: notionUtils.getStatus(unconvertedProposal),
      proposalId: notionUtils.getRichText(
        unconvertedProposal,
        this.config.notion.propertyKeys.proposalId
      ),
      discussionThreadURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.notion.propertyKeys.discussionThread
      ),
      ipfsURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.notion.propertyKeys.ipfs
      ),
      voteURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.notion.propertyKeys.vote
      ),
      date: notionUtils.getDate(unconvertedProposal)
    };
  }

  async queryNotionDb(filters: any, sorts = []): Promise<Proposal[]> {
    const databaseReponse = await this.notion.databases.query(
      {
        database_id: this.config.notion.database_id,
        filter: filters,
        sorts
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

  async getVoteProposals(): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.voting
    );
    return proposals;
  }

  async getNextProposalIdNumber(): Promise<number> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.proposalId
    );
    const sortProposalsById = proposals.map((proposal) => {
      return Number(proposal.proposalId.split(this.config.notion.propertyKeys.proposalIdPrefix)[1]);
    }).sort((a:number, b:number) => { return b - a; });
    const nextProposalId = sortProposalsById[0] + 1;
    return (Number.isNaN(nextProposalId) ? 1 : nextProposalId);
  }

  async assignProposalIds(proposals: Proposal[]): Promise<Proposal[]> {
    const nextProposalIdNumber = await this.getNextProposalIdNumber();
    proposals.forEach((proposal, index) => {
      if (proposal.proposalId === '') {
        proposal.proposalId = `${this.config.notion.propertyKeys.proposalIdPrefix}${nextProposalIdNumber + index}`;
      }
    });
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

  async updateDiscussionURL(proposal: Proposal) {
    await this.updateMetaData(
      proposal.hash,
      { [this.config.notion.propertyKeys.discussionThread]: { url: proposal.discussionThreadURL } }
    );
  }

  async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
    this.updateMetaData(proposal.hash, {
      [this.config.notion.propertyKeys.status]: {
        select: { name: this.config.notion.propertyKeys.statusTemperatureCheck }
      },
      [this.config.notion.propertyKeys.proposalId]: {
        rich_text: [
          {
            type: 'text',
            text: { content: proposal.proposalId }
          }
        ]
      }
    });
  }

  async updateStatusVoting(pageId: string) {
    this.updateMetaData(pageId, {
      [this.config.notion.propertyKeys.status]: {
        select: { name: this.config.notion.propertyKeys.statusVoting }
      }
    });
  }

  async updateStatusApproved(pageId: string): Promise<string> {
    this.updateMetaData(pageId, {
      [this.config.notion.propertyKeys.status]: {
        select: { name: this.config.notion.propertyKeys.statusApproved }
      }
    });
    return this.config.notion.propertyKeys.statusApproved;
  }

  async updateStatusCancelled(pageId: string): Promise<string> {
    this.updateMetaData(pageId, {
      [this.config.notion.propertyKeys.status]: {
        select: { name: this.config.notion.propertyKeys.statusCancelled }
      }
    });
    return this.config.notion.propertyKeys.statusCancelled;
  }

  async updateVoteAndIPFS(proposal: Proposal) {
    this.updateMetaData(
      proposal.hash,
      {
        [this.config.notion.propertyKeys.vote]: { url: proposal.voteURL },
        [this.config.notion.propertyKeys.ipfs]: { url: proposal.ipfsURL }
      }
    );
    return this.config.notion.propertyKeys.vote;
  }

  async getContentMarkdown(pageId: string): Promise<string> {
    const mdBlocks = await this.notionToMd.pageToMarkdown(pageId);
    const mdString = this.notionToMd.toMarkdownString(mdBlocks);
    return mdString;
  }

  async pageIdToProposal(pageId: string) {
    const page = await this.notion.pages.retrieve({ page_id: pageId });
    return this.toProposal(page);
  }

  // eslint-disable-next-line class-methods-use-this
  appendProposal(proposal: Proposal) {
    return `${proposal.markdown}\n\n---\n[Discussion Thread](${proposal.discussionThreadURL}) | [IPFS](${proposal.ipfsURL})`;
  }

  // eslint-disable-next-line class-methods-use-this
  async pushMetaData() {
    const x = null;
  }
}
