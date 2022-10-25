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
    network: 'mainnet',
    projectId: '188',
    gnosisSafeAddress: '0x32533f602527024EBC64FEbF05F18D32105fB199',
    // network: 'goerli' as 'mainnet',
    // projectId: '37',
    // gnosisSafeAddress: '0x4f136b4e0997EBbe1851eA0BDd63145A2ebeEB73'
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
    database_id: '',
    current_cycle_block_id: 'a09ccc388d2c442fbbd7b9ad3f851e16',
    payouts_database_id: 'f1c5c3cd266b48dcbe2e6ba3dba41f28',
    reserves_database_id: '8677be28e19b4960b460656c53465a76',
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

  payoutsV3: {
    property: 'JB DAO Treasury',
    rich_text: {
      contains: 'V3'
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
