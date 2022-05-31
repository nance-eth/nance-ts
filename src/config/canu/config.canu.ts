const config = {
  nameId: 'canu',
  name: 'canuDAO',
  scheme: ['notion', 'discord', 'snapshot'],
  discord: {
    guildId: '889377541675159602',
    channelId: '964601032703352873',
    alertRole: '958529682796605440',
    poll: {
      votingTimeDays: 3,
      voteYesEmoji: '👍',
      voteNoEmoji: '👎',
      voteGoVoteEmoji: '🗳',
      voteCanceledEmoji: '❌',
      minYesVotes: 1,
      yesNoRatio: 0.3,
      showResults: true
    },
  },
  notion: {
    publicURLPrefix: 'foil-flat-c43.notion.site',
    database_id: '50e11ebe3d2440b7a64d39805868df87',
    propertyKeys: {
      proposalId: 'Juicebox Proposal ID',
      proposalIdPrefix: 'JBP-',
      discussionThread: 'Discussion Thread',
      ipfs: 'IPFS',
    },
    filters: { }
  },
  snapshot: {
    base: 'https://snapshot.org/#',
    space: 'jigglyjams.eth',
    choices: ['For', 'Against', 'Abstain'],
    votingTimeDays: 3,
    quroum: 1,
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
    property: null,
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
    and: [
      {
        property: 'Status',
        select: {
          equals: 'Voting',
        },
      },
      {
        property: 'Snapshot',
        url: {
          is_not_empty: true,
        },
      }],
  },
};

export default config;
