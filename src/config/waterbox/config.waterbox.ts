import 'dotenv/config';
import { NanceConfig } from '../../types';

const NAME = 'waterbox';

const config: NanceConfig = {
  nameId: 'waterbox',
  name: 'waterbox',
  calendarPath: `${__dirname}/${NAME}.ics`,
  scheme: ['github', 'discord', 'snapshot'],
  proposalDataBackup: 'ipfs',
  ipfsGateway: 'https://gateway.pinata.cloud/ipfs',
  votingResultsDashboard: '',
  translation: {
    api: 'deepl',
    targetLanguage: 'zh',
    storage: {
      user: 'jigglyjams',
      repo: 'dev-governance'
    }
  },
  juicebox: {
    // network: 'mainnet',
    // projectId: '188'
    // gnosisSafeAddress: '0x32533f602527024EBC64FEbF05F18D32105fB199'
    network: 'rinkeby',
    // projectId: '4661', // V2
    projectId: '644', // V1
    gnosisSafeAddress: '0xB459e6B0a53a9401F6f4f6D31c1eDD30c1cbe3E6'
  },
  discord: {
    API_KEY: process.env.DISCORD_KEY_WATERBOX ?? '',
    guildId: '889377541675159602',
    channelId: '964601032703352873',
    alertRole: '958529682796605440',
    poll: {
      voteYesEmoji: '👍',
      voteNoEmoji: '👎',
      voteGoVoteEmoji: '🗳',
      votePassEmoji: '✅',
      voteCancelledEmoji: '❌',
      minYesVotes: 1,
      yesNoRatio: 0.3,
      showResults: true
    },
  },
  notion: {
    API_KEY: process.env.NOTION_KEY_WATERBOX ?? '',
    publicURLPrefix: 'foil-flat-c43.notion.site',
    database_id: '8f5a93009a364c4ebf69757ff98be405',
    current_cycle_block_id: '8458fa50e1724d7aa721275a195dece3',
    payouts_database_id: '5f2b501f8e724af2879f4e440548da72',
    reserves_database_id: '5e62c3b048944801bee6bf48b48896ba',
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
      typePayout: 'One-Time Payout',
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
    repo: 'dev-governance',
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
      governanceCycle: 'Funding Cycle'
    },
  },
  snapshot: {
    base: 'https://snapshot.org/#',
    space: 'jigglyjams.eth',
    choices: ['For', 'Against', 'Abstain'],
    minTokenPassingAmount: 1,
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
