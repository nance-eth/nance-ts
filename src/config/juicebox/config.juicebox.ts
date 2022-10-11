import 'dotenv/config';
import { NanceConfig } from '../../types';

const NAME = 'juicebox';

const config: NanceConfig = {
  nameId: 'juiceboxDAO',
  name: 'juiceboxDAO',
  calendarPath: `${__dirname}/${NAME}.ics`,
  scheme: ['notion', 'discord', 'snapshot'],
  proposalDataBackup: 'ipfs',
  ipfsGateway: 'https://gateway.pinata.cloud/ipfs',
  votingResultsDashboard: '',
  translation: {
    api: 'deepl',
    targetLanguage: 'zh',
    storage: {
      user: 'jigglyjams',
      repo: 'juicebox-governance'
    }
  },
  juicebox: {
    network: 'mainnet',
    projectId: '1',
    gnosisSafeAddress: '0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e'
    // gnosisSafeAddress: ''
  },
  discord: {
    API_KEY: process.env.DISCORD_KEY_JUICEBOX ?? '',
    guildId: '775859454780244028',
    channelId: '873248745771372584',
    alertRole: '953865172764729404',
    poll: {
      voteYesEmoji: '👍',
      voteNoEmoji: '👎',
      voteGoVoteEmoji: '🗳',
      votePassEmoji: '✅',
      voteCancelledEmoji: '❌',
      minYesVotes: 10,
      yesNoRatio: 0.3,
      showResults: true
    },
  },
  notion: {
    API_KEY: process.env.NOTION_KEY_JUICEBOX ?? '',
    publicURLPrefix: 'juicebox.notion.site',
    database_id: '9d126f9148dc42ee83317d5cd74e4db4',
    current_cycle_block_id: '7e88ba32f5484ea9900a5fb00426bc9a',
    payouts_database_id: 'c51c3d59c21445988f17c9332b7163dc',
    reserves_database_id: 'b7276b64a43643d2bb8ee355376dd4fa',
    propertyKeys: {
      proposalId: 'Juicebox Proposal ID',
      status: 'Status',
      statusTemperatureCheck: 'Temperature Check',
      statusVoting: 'Voting',
      statusApproved: 'Approved',
      statusCancelled: 'Cancelled',
      proposalIdPrefix: 'JBP-',
      discussionThread: 'Discussion Thread',
      ipfs: 'IPFS',
      vote: 'Snapshot',
      type: 'Category',
      typeRecurringPayout: 'Recurring Payment',
      typePayout: 'Payout',
      governanceCycle: 'Funding Cycle',
      governanceCyclePrefix: 'FC#',
      payoutAmountUSD: 'USD Payout Amount',
      payoutAddress: 'Payout Address',
      payoutCount: 'Number of Payouts',
      reservePercentage: 'Percentage',
      treasuryVersion: 'JB DAO Treasury',
      payoutFirstFC: 'First FC',
      payoutLastFC: 'Last FC',
      payoutRenewalFC: 'Renewal FC',
      payoutProposalLink: 'Proposal',
      payoutType: 'Type of payout',
      payoutName: 'ENS'
    },
    filters: { }
  },
  github: {
    user: 'jigglyjams',
    repo: 'juicebox-governance',
    propertyKeys: {
      title: 'Name',
      proposalId: 'Juicebox Proposal ID',
      status: 'Status',
      statusTemperatureCheck: 'Temperature Check',
      statusVoting: 'Voting',
      statusApproved: 'Approved',
      statusCancelled: 'Cancelled',
      proposalIdPrefix: 'JBP-',
      discussionThread: 'Discussion Thread',
      ipfs: 'Data Backup',
      vote: 'Voting',
      type: 'Category',
      governanceCycle: 'Funding Cycle',
    },
  },
  snapshot: {
    base: 'https://snapshot.org/#',
    space: 'jbdao.eth',
    choices: ['For', 'Against', 'Abstain'],
    minTokenPassingAmount: 80E6,
    passingRatio: 0.66,
  },
};

config.notion.filters = {
  preDiscussion: {
    and: [
      {
        property: 'Status',
        select: {
          equals: 'Discussion',
        },
      },
      {
        property: config.notion.propertyKeys.discussionThread,
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
        property: config.notion.propertyKeys.discussionThread,
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
    property: config.notion.propertyKeys.proposalId,
    rich_text: {
      contains: config.notion.propertyKeys.proposalIdPrefix,
    },
  },

  temperatureCheck: {
    property: 'Status',
    select: {
      equals: 'Temperature Check',
    },
  },

  voting: {
    property: 'Status',
    select: {
      equals: 'Voting',
    },
  },

  approvedRecurringPayment: {
    and: [
      {
        property: 'Status',
        select: {
          equals: 'Approved',
        },
      },
      {
        property: config.notion.propertyKeys.type,
        multi_select: {
          contains: config.notion.propertyKeys.typeRecurringPayout
        }
      }
    ],
  },

  payoutsV1: {
    property: 'JB DAO Treasury',
    rich_text: {
      contains: 'V1'
    }
  },

  payoutsV2: {
    property: 'JB DAO Treasury',
    rich_text: {
      contains: 'V2'
    }
  },

  reservedIsNotOwner: {
    property: 'isOwner',
    rich_text: {
      contains: 'false'
    }
  }
};

export default config;
