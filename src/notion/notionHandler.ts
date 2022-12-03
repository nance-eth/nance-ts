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
  CreatePageParameters
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
  private filters;

  constructor(
    private config: NanceConfig
  ) {
    this.notion = new NotionClient({ auth: process.env[this.config.notion.API_KEY] });
    this.notionToMd = new NotionToMarkdown({ notionClient: this.notion });
    this.filters = notionUtils.filters(this.config);
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
        this.config.propertyKeys.proposalId
      ),
      discussionThreadURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.propertyKeys.discussionThread
      ),
      ipfsURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.propertyKeys.ipfs
      ),
      voteURL: notionUtils.getPropertyURL(
        unconvertedProposal,
        this.config.propertyKeys.vote
      ),
      date: notionUtils.getDate(unconvertedProposal),
      governanceCycle: Number(
        notionUtils.getRichText(
          unconvertedProposal,
          this.config.propertyKeys.governanceCycle
        ).split(this.config.propertyKeys.governanceCyclePrefix)[1] ?? ''
      ),
      version: notionUtils.getRichText(
        unconvertedProposal,
        this.config.propertyKeys.treasuryVersion
      ),
      voteSetup: notionUtils.getVoteSetup(unconvertedProposal)
    };
    if (getExtendedData) {
      if (
        cleanProposal.type === this.config.propertyKeys.typeRecurringPayout
        || cleanProposal.type === this.config.propertyKeys.typePayout
      ) {
        cleanProposal.payout = {
          address: notionUtils.getRichText(
            unconvertedProposal,
            this.config.propertyKeys.payoutAddress
          ),
          amountUSD: notionUtils.getNumber(
            unconvertedProposal,
            this.config.propertyKeys.payoutAmountUSD
          ),
          count: notionUtils.getNumber(
            unconvertedProposal,
            this.config.propertyKeys.payoutCount
          ),
          payName: notionUtils.getRichText(
            unconvertedProposal,
            this.config.propertyKeys.payName
          )
        };
      }
    }
    return cleanProposal;
  }

  private toPayout(unconvertedPayout: GetDatabaseResponse | GetPageResponse): Payout {
    return {
      address: notionUtils.getRichText(unconvertedPayout, this.config.propertyKeys.payoutAddress),
      amountUSD: notionUtils.getNumber(unconvertedPayout, this.config.propertyKeys.payoutAmountUSD),
      count:
        notionUtils.getNumber(unconvertedPayout, 'Last FC') - notionUtils.getNumber(unconvertedPayout, 'First FC') + 1,
      payName: notionUtils.getRichText(unconvertedPayout, this.config.propertyKeys.payoutName)
    };
  }

  private toReserve(unconvertedPayout: GetDatabaseResponse | GetPageResponse): Reserve {
    return {
      address: notionUtils.getRichText(unconvertedPayout, this.config.propertyKeys.payoutAddress),
      percentage: notionUtils.getNumber(unconvertedPayout, this.config.propertyKeys.reservePercentage),
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
      return Number(a.proposalId.split(this.config.propertyKeys.proposalIdPrefix)[1])
        - Number(b.proposalId.split(this.config.propertyKeys.proposalIdPrefix)[1]);
    });
  }

  async queryNotionPayoutDb(filters: any): Promise<any> {
    const databaseReponse = await this.notion.databases.query(
      {
        database_id: this.config.notion.payouts_database_id,
        filter: filters,
        sorts: [{
          property: this.config.propertyKeys.payoutAddress,
          direction: 'descending'
        }]
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
        sorts: [{
          property: this.config.propertyKeys.payoutAddress,
          direction: 'descending'
        }]
      } as QueryDatabaseParameters
    );
    return databaseReponse.results.map((data: any) => {
      return this.toReserve(data as GetDatabaseResponse);
    });
  }

  async getToDiscuss(extendedData = false): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      notionUtils.filters(this.config).preDiscussion,
      extendedData
    );
    return proposals;
  }

  async getDiscussionProposals(extendedData = false): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.filters.discussion,
      extendedData
    );
    return proposals;
  }

  async getTemperatureCheckProposals(extendedData = false): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.filters.temperatureCheck,
      extendedData
    );
    return proposals;
  }

  async getVoteProposals(extendedData = false): Promise<Proposal[]> {
    const proposals = await this.queryNotionDb(
      this.filters.voting,
      extendedData
    );
    return proposals;
  }

  async getApprovedRecurringPaymentProposals(governanceCycle: string): Promise<Proposal[]> {
    // add filter by governance cycle (this changes so must push it in here)
    this.filters.approvedRecurringPayment.and.push(
      {
        property: this.config.propertyKeys.governanceCycle,
        rich_text: {
          equals: `${this.config.propertyKeys.governanceCyclePrefix}${governanceCycle}`
        }
      }
    );
    const proposals = await this.queryNotionDb(
      this.filters.approvedRecurringPayment,
      true // include payout data
    );
    this.filters.approvedRecurringPayment.and.pop();
    return proposals;
  }

  async getProposalsByGovernanceCycle(governanceCycle: string): Promise<Proposal[]> {
    const filter = {
      and: [
        {
          property: this.config.propertyKeys.governanceCycle,
          rich_text: {
            equals: `${this.config.propertyKeys.governanceCyclePrefix}${governanceCycle}`
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
          [this.config.propertyKeys.payoutName]: {
            title: [
              {
                text: { content: payoutTitle },
              }
            ]
          },
          [this.config.propertyKeys.payoutAddress]: {
            rich_text: [
              {
                text: { content: proposal.payout.address }
              }
            ]
          },
          [this.config.propertyKeys.payoutAmountUSD]: {
            number: proposal.payout.amountUSD
          },
          [this.config.propertyKeys.treasuryVersion]: {
            rich_text: [
              {
                text: { content: proposal.version }
              }
            ]
          },
          [this.config.propertyKeys.payoutType]: {
            select: { name: 'NANCE' } // mark as nance for now so its easy to identify and supplement manually
          },
          [this.config.propertyKeys.payoutProposalLink]: {
            url: proposal.voteURL
          },
          [this.config.propertyKeys.payoutFirstFC]: {
            number: proposal.governanceCycle
          },
          [this.config.propertyKeys.payoutLastFC]: {
            number: proposal.governanceCycle + proposal.payout.count
          },
          [this.config.propertyKeys.payoutRenewalFC]: {
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
          [this.config.propertyKeys.type]: {
            multi_select: [
              { name: proposal.type }
            ]
          },
          [this.config.propertyKeys.payoutAddress]: {
            rich_text: [
              { text: { content: proposal.payout?.address || proposal.reserve?.address || '' } }
            ]
          },
          [this.config.propertyKeys.payoutCount]: {
            number: proposal.payout?.count || null
          },
          [this.config.propertyKeys.payoutAmountUSD]: {
            number: proposal.payout?.amountUSD || null
          },
          [this.config.propertyKeys.treasuryVersion]: {
            rich_text: [
              { text: { content: `V${proposal.version}` } }
            ]
          },
          [this.config.propertyKeys.governanceCycle]: {
            rich_text: [
              { text: { content: `${this.config.propertyKeys.governanceCyclePrefix}${String(proposal.governanceCycle)}` } }
            ]
          },
          [this.config.propertyKeys.status]: {
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
      this.filters.proposalId,
      false,
      'descending'
    );
    const sortProposalsById = proposals.map((proposal) => {
      return Number(proposal.proposalId.split(this.config.propertyKeys.proposalIdPrefix)[1]);
    }).sort((a:number, b:number) => { return b - a; });
    const nextProposalId = sortProposalsById[0] + 1;
    return (Number.isNaN(nextProposalId) ? 1 : nextProposalId);
  }

  async assignProposalIds(proposals: Proposal[]): Promise<Proposal[]> {
    const nextProposalIdNumber = await this.getNextProposalIdNumber();
    proposals.forEach((proposal, index) => {
      if (proposal.proposalId === '') {
        proposal.proposalId = `${this.config.propertyKeys.proposalIdPrefix}${nextProposalIdNumber + index}`;
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
      { [this.config.propertyKeys.discussionThread]: { url: proposal.discussionThreadURL || '' } }
    );
  }

  async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
    this.updateMetaData(proposal.hash, {
      [this.config.propertyKeys.status]: {
        select: { name: this.config.propertyKeys.statusTemperatureCheck }
      },
      [this.config.propertyKeys.proposalId]: {
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
      [this.config.propertyKeys.status]: {
        select: { name: this.config.propertyKeys.statusVoting }
      }
    });
  }

  async updateStatusApproved(pageId: string): Promise<string> {
    this.updateMetaData(pageId, {
      [this.config.propertyKeys.status]: {
        select: { name: this.config.propertyKeys.statusApproved }
      }
    });
    return this.config.propertyKeys.statusApproved;
  }

  async updateStatusCancelled(pageId: string): Promise<string> {
    this.updateMetaData(pageId, {
      [this.config.propertyKeys.status]: {
        select: { name: this.config.propertyKeys.statusCancelled }
      }
    });
    return this.config.propertyKeys.statusCancelled;
  }

  async updateVoteAndIPFS(proposal: Proposal) {
    this.updateMetaData(
      proposal.hash,
      {
        [this.config.propertyKeys.vote]: { url: proposal.voteURL },
        [this.config.propertyKeys.ipfs]: { url: proposal.ipfsURL }
      }
    );
    return this.config.propertyKeys.vote;
  }

  async getContentMarkdown(pageId: string): Promise<Proposal> {
    return this.notion.pages.retrieve({ page_id: pageId }).then(async (unconvertedProposal: GetDatabaseResponse | GetPageResponse) => {
      const mdBlocks = await this.notionToMd.pageToMarkdown(pageId);
      const mdString = this.notionToMd.toMarkdownString(mdBlocks);
      const proposal = this.toProposal(unconvertedProposal, true);
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
    return this.queryNotionPayoutDb(this.filters[`payouts${version as 'V1' | 'V2'}`]);
  }

  async getReserveDb(version: string): Promise<Reserve[]> {
    return this.queryNotionReserveDb(this.filters.reservedIsNotOwner);
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
