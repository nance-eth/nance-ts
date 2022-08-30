const config = {
  nameId: 'dev',
  name: 'dev',
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
    projectId: '4661',
    gnosisSafeAddress: '0xB459e6B0a53a9401F6f4f6D31c1eDD30c1cbe3E6'
  },
  discord: {
    guildId: '889377541675159602',
    channelId: '964601032703352873',
    alertRole: '958529682796605440',
    poll: {
      votingTimeDays: 3,
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
    publicURLPrefix: 'foil-flat-c43.notion.site',
    database_id: '65d4e28b2d624a97bdbcd09d54b5add4',
    payouts_database_id: 'f5aaed6fa15d4138b52069b097510a55',
    reserves_database_id: '5f03d3ded5294819baa05210f41ad395',
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
      category: 'Category',
      categoryRecurringPayout: 'Recurring Payment',
      categoryPayout: 'One-Time Payout',
      governanceCycle: 'Funding Cycle',
      governanceCyclePrefix: 'FC#',
      payoutAmountUSD: 'USD Payout Amount',
      payoutAddress: 'Payout Address',
      payoutCount: 'Number of Payouts',
      reservePercentage: 'Percentage'
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
      category: 'Category',
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
