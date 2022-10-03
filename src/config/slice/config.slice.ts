import 'dotenv/config';
import { NanceConfig } from '../../types';

const NAME = 'slice';

const config: NanceConfig = {
  nameId: 'slice',
  name: 'slice',
  calendarPath: `${__dirname}/${NAME}.ics`,
  scheme: ['github', 'discord', 'snapshot'],
  proposalDataBackup: 'ipfs',
  ipfsGateway: 'https://gateway.pinata.cloud/ipfs',
  votingResultsDashboard: '',
  juicebox: {
    // network: 'mainnet',
    // projectId: '188'
    // gnosisSafeAddress: '0x32533f602527024EBC64FEbF05F18D32105fB199'
    network: 'rinkeby',
    projectId: '4661',
    gnosisSafeAddress: '0xB459e6B0a53a9401F6f4f6D31c1eDD30c1cbe3E6'
  },
  discord: {
    API_KEY: process.env.DISCORD_KEY_SLICE ?? '',
    guildId: '889377541675159602',
    channelId: '1026502515669352458',
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
    API_KEY: process.env.NOTION_KEY_SLICE ?? '',
    publicURLPrefix: 'slice.notion.site',
    database_id: 'ff54e8e188684692af709dc47c48d8ba',
    current_cycle_block_id: '8458fa50e1724d7aa721275a195dece3',
    payouts_database_id: '5f2b501f8e724af2879f4e440548da72',
    reserves_database_id: '5e62c3b048944801bee6bf48b48896ba',
    propertyKeys: {
      proposalId: 'Slice Proposal Number',
      status: 'Status',
      statusTemperatureCheck: 'Temp Check (Do we even vote on it)',
      statusVoting: 'Voting',
      statusApproved: 'Approved',
      statusCancelled: 'Cancelled',
      proposalIdPrefix: 'SL-',
      discussionThread: 'Discussion Thread',
      ipfs: 'IPFS',
      vote: 'Snapshot',
      type: 'Category',
      typeRecurringPayout: 'Treasury',
      typePayout: 'Treasury',
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
    repo: 'slice-governance',
    propertyKeys: {
      title: 'Name',
      proposalId: 'Slice Proposal ID',
      status: 'Status',
      statusTemperatureCheck: 'Temperature Check',
      statusVoting: 'Voting',
      statusApproved: 'Approved',
      statusCancelled: 'Cancelled',
      proposalIdPrefix: 'SL-',
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
          equals: 'Discussion (ready to be considered for temp check)',
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
          equals: 'Discussion (ready to be considered for temp check)',
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
      equals: config.notion.propertyKeys.statusTemperatureCheck,
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
