/* eslint-disable no-param-reassign */
import { Client as NotionClient } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { markdownToBlocks } from '@tryfabric/martian';
import {
  QueryDatabaseParameters,
  UpdatePageParameters,
  UpdatePageResponse,
  GetDatabaseResponse,
  GetPageResponse,
  CreatePageParameters,
} from '@notionhq/client/build/src/api-endpoints';
import {
  DataContentHandler
} from './notionTypes';
import {
  NanceConfig,
  Payout,
  Proposal,
  Reserve
} from '../types';
import * as notionUtils from './notionUtils';

export class NotionHandler implements DataContentHandler {
  private notion;
  private notionToMd;

  constructor(
    private config: NanceConfig
  ) {
    this.notion = new NotionClient({ auth: this.config.notion.API_KEY });
    this.notionToMd = new NotionToMarkdown({ notionClient: this.notion });
  }

  private toProposal(
    unconvertedProposal: GetDatabaseResponse | GetPageResponse,
    getExtendedData = false
  ): Proposal {
    const cleanProposal: Proposal = {
      hash: unconvertedProposal.id.replaceAll('-', ''),
      title: notionUtils.getTitle(unconvertedProposal),
      url: notionUtils.getPublicURL(unconvertedProposal, this.config.notion.publicURLPrefix),
      type: notionUtils.getType(unconvertedProposal),
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
      date: notionUtils.getDate(unconvertedProposal),
      governanceCycle: Number(
        notionUtils.getRichText(
          unconvertedProposal,
          this.config.notion.propertyKeys.governanceCycle
        ).split(this.config.notion.propertyKeys.governanceCyclePrefix)[1] ?? ''
      )
    };
    if (getExtendedData) {
      if (
        cleanProposal.type === this.config.notion.propertyKeys.typeRecurringPayout
        || cleanProposal.type === this.config.notion.propertyKeys.typePayout
      ) {
        cleanProposal.payout = {
          address: notionUtils.getRichText(
            unconvertedProposal,
            this.config.notion.propertyKeys.payoutAddress
          ),
          amountUSD: notionUtils.getNumber(
            unconvertedProposal,
            this.config.notion.propertyKeys.payoutAmountUSD
          ),
          count: notionUtils.getNumber(
            unconvertedProposal,
            this.config.notion.propertyKeys.payoutCount
          ),
          treasuryVersion: notionUtils.getRichText(
            unconvertedProposal,
            this.config.notion.propertyKeys.treasuryVersion
          )
        };
      }
    }
    return cleanProposal;
  }

  private toPayout(unconvertedPayout: GetDatabaseResponse | GetPageResponse): Payout {
    return {
      address: notionUtils.getRichText(unconvertedPayout, this.config.notion.propertyKeys.payoutAddress),
      amountUSD: notionUtils.getNumber(unconvertedPayout, this.config.notion.propertyKeys.payoutAmountUSD),
      count:
        notionUtils.getNumber(unconvertedPayout, 'Last FC') - notionUtils.getNumber(unconvertedPayout, 'First FC') + 1
    };
  }

  private toReserve(unconvertedPayout: GetDatabaseResponse | GetPageResponse): Reserve {
    return {
      address: notionUtils.getRichText(unconvertedPayout, this.config.notion.propertyKeys.payoutAddress),
      percentage: notionUtils.getNumber(unconvertedPayout, this.config.notion.propertyKeys.reservePercentage),
    };
  }

  async queryNotionDb(filters: any, extendedData = false, sortTimeDirection = 'ascending'): Promise<Proposal[]> {
    const databaseReponse = await this.notion.databases.query(
      {
        database_id: this.config.notion.database_id,
        filter: filters,
        sorts: [{
          timestamp: 'created_time',
          direction: sortTimeDirection
        }]
      } as QueryDatabaseParameters
    );
    return databaseReponse.results.map((data: any) => {
      return this.toProposal(data as GetDatabaseResponse, extendedData);
    }).sort((a, b) => {
      // sort ascending by proposalId
      return Number(a.proposalId.split(this.config.notion.propertyKeys.proposalIdPrefix)[1])
        - Number(b.proposalId.split(this.config.notion.propertyKeys.proposalIdPrefix)[1]);
    });
  }

  async queryNotionPayoutDb(filters: any): Promise<any> {
    const databaseReponse = await this.notion.databases.query(
      {
        database_id: this.config.notion.payouts_database_id,
        filter: filters,
      } as QueryDatabaseParameters
    );
    return databaseReponse.results.map((data: any) => {
      return this.toPayout(data as GetDatabaseResponse);
    });
  }

  async queryNotionReserveDb(filters: any): Promise<any> {
    const databaseReponse = await this.notion.databases.query(
      {
        database_id: this.config.notion.reserves_database_id,
        filter: filters,
      } as QueryDatabaseParameters
    );
    return databaseReponse.results.map((data: any) => {
      return this.toReserve(data as GetDatabaseResponse);
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

  async getApprovedRecurringPaymentProposals(governanceCycle: string): Promise<Proposal[]> {
    // add filter by governance cycle (this changes so must push it in here)
    this.config.notion.filters.approvedRecurringPayment.and.push(
      {
        property: this.config.notion.propertyKeys.governanceCycle,
        rich_text: {
          equals: `${this.config.notion.propertyKeys.governanceCyclePrefix}${governanceCycle}`
        }
      }
    );
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.approvedRecurringPayment,
      true // include payout data
    );
    this.config.notion.filters.approvedRecurringPayment.and.pop();
    return proposals;
  }

  async getProposalsByGovernanceCycle(governanceCycle: string): Promise<Proposal[]> {
    const filter = {
      and: [
        {
          property: this.config.notion.propertyKeys.governanceCycle,
          rich_text: {
            equals: `${this.config.notion.propertyKeys.governanceCyclePrefix}${governanceCycle}`
          }
        }
      ]
    };
    const proposals = await this.queryNotionDb(
      filter,
      true // include payout data
    );
    return proposals;
  }

  async addPayoutToDb(payoutTitle: string, proposal: Proposal): Promise<string> {
    if (proposal.payout && proposal.payout.count && proposal.governanceCycle) {
      this.notion.pages.create({
        parent: {
          database_id: this.config.notion.payouts_database_id,
        },
        properties: {
          [this.config.notion.propertyKeys.payoutName]: {
            title: [
              {
                text: { content: payoutTitle },
              }
            ]
          },
          [this.config.notion.propertyKeys.payoutAddress]: {
            rich_text: [
              {
                text: { content: proposal.payout.address }
              }
            ]
          },
          [this.config.notion.propertyKeys.payoutAmountUSD]: {
            number: proposal.payout.amountUSD
          },
          [this.config.notion.propertyKeys.treasuryVersion]: {
            rich_text: [
              {
                text: { content: proposal.payout.treasuryVersion }
              }
            ]
          },
          [this.config.notion.propertyKeys.payoutType]: {
            select: { name: 'NANCE' } // mark as nance for now so its easy to identify and supplement manually
          },
          [this.config.notion.propertyKeys.payoutProposalLink]: {
            url: proposal.voteURL
          },
          [this.config.notion.propertyKeys.payoutFirstFC]: {
            number: proposal.governanceCycle
          },
          [this.config.notion.propertyKeys.payoutLastFC]: {
            number: proposal.governanceCycle + proposal.payout.count
          },
          [this.config.notion.propertyKeys.payoutRenewalFC]: {
            number: (proposal.governanceCycle + proposal.payout.count + 1)
          }
        }
      } as CreatePageParameters);
      return Promise.resolve('Success');
    }
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject('Bad proposal format');
  }

  async addProposalToDb(proposal: Proposal) {
    if (proposal.body) {
      return this.notion.pages.create({
        icon: { type: 'emoji', emoji: '📜' },
        parent: {
          database_id: this.config.notion.database_id
        },
        properties: {
          Name: {
            title: [
              { text: { content: proposal.title } }
            ]
          },
          [this.config.notion.propertyKeys.type]: {
            multi_select: [
              { name: proposal.type }
            ]
          },
          [this.config.notion.propertyKeys.payoutAddress]: {
            rich_text: [
              { text: { content: proposal.payout?.address } }
            ]
          },
          [this.config.notion.propertyKeys.payoutCount]: {
            number: proposal.payout?.count || null
          },
          [this.config.notion.propertyKeys.payoutAmountUSD]: {
            number: proposal.payout?.amountUSD || null
          },
          [this.config.notion.propertyKeys.treasuryVersion]: {
            rich_text: [
              { text: { content: proposal.payout?.treasuryVersion } }
            ]
          },
          [this.config.notion.propertyKeys.governanceCycle]: {
            rich_text: [
              { text: { content: String(proposal.governanceCycle) } }
            ]
          },
          [this.config.notion.propertyKeys.status]: {
            select: { name: 'Draft' }
          },
          Date: {
            date: { start: new Date().toISOString().split('T')[0] }
          }
        },
        children:
          markdownToBlocks(proposal.body)
      } as CreatePageParameters).then((notionResponse) => {
        return notionResponse.id.replaceAll('-', '');
      });
    }
    return Promise.reject();
  }

  async getNextProposalIdNumber(): Promise<number> {
    const proposals = await this.queryNotionDb(
      this.config.notion.filters.proposalId,
      false,
      'descending'
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

  async getContentMarkdown(pageId: string): Promise<Proposal> {
    return this.notion.pages.retrieve({ page_id: pageId }).then(async (unconvertedProposal: GetDatabaseResponse | GetPageResponse) => {
      const mdBlocks = await this.notionToMd.pageToMarkdown(pageId);
      const mdString = this.notionToMd.toMarkdownString(mdBlocks);
      const proposal = this.toProposal(unconvertedProposal);
      return {
        ...proposal,
        body: mdString
      };
    }).catch((e) => { return Promise.reject(e.message); });
  }

  async pageIdToProposal(pageId: string) {
    const page = await this.notion.pages.retrieve({ page_id: pageId });
    return this.toProposal(page, true);
  }

  // eslint-disable-next-line class-methods-use-this
  appendProposal(proposal: Proposal) {
    return `${proposal.body}\n\n---\n[Discussion Thread](${proposal.discussionThreadURL}) | [IPFS](${proposal.ipfsURL})`;
  }

  async getPayoutsDb(version: string): Promise<Payout[]> {
    return this.queryNotionPayoutDb(this.config.notion.filters[`payouts${version}`]);
  }

  async getReserveDb(version: string): Promise<Reserve[]> {
    return this.queryNotionReserveDb(this.config.notion.filters.reservedIsNotOwner);
  }

  async getCurrentGovernanceCycle(): Promise<number> {
    const currentGovernanceCycleBlock = await this.notion.blocks.retrieve({
      block_id: this.config.notion.current_cycle_block_id
    }) as any;
    const currentGovernanceCycle = currentGovernanceCycleBlock.paragraph.rich_text[0].text.content;
    return Number(currentGovernanceCycle);
  }

  async incrementGovernanceCycle() {
    const currentCycle = await this.getCurrentGovernanceCycle();
    this.notion.blocks.update({
      block_id: this.config.notion.current_cycle_block_id,
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: String(currentCycle + 1) }
          }
        ]
      }
    });
  }
}
