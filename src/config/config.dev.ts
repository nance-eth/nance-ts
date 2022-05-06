const config = {
  name: 'juiceboxDAO',
  guildId: '889377541675159602',
  channelId: '964601032703352873',
  alertRole: '958529682796605440',
  discussionThreadPropertyKey: 'Discussion Thread',
  ipfsPropertyKey: 'IPFS',
  poll: {
    votingTimeDays: 3,
    voteYesEmoji: '👍',
    voteNoEmoji: '👎',
    voteGoVoteEmoji: '🗳',
    voteCanceledEmoji: '❌',
    minYesVotes: 1,
    yesNoRatio: 0.3,
  },
  location: 'notion',
  database_id: '50e11ebe3d2440b7a64d39805868df87',
  snapshot: {
    base: 'https://snapshot.org/#',
    space: 'jigglyjams.eth',
    choices: ['For', 'Against', 'Abstain'],
    votingTimeDays: 3,
    quroum: 1,
    passingRatio: 0.66,
  },
  notionPublicUrlPrefix: 'foil-flat-c43.notion.site',
  proposalIdPrefix: 'JBP-',
  ipfsGateway: 'https://gateway.pinata.cloud/ipfs',
  proposalIdProperty: 'Juicebox Proposal ID',
  governanceScheduleDb: {

  },
  filters: [
    {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Discussion',
          },
        },
        {
          url: {
            is_empty: true,
          },
          property: 'Discussion Thread',
        }],
    },

    {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Discussion',
          },
        },
        {
          property: 'Discussion Thread',
          url: {
            is_not_empty: true,
          },
        }],
    },

    {
      property: null,
      rich_text: {
        contains: 'JBP-',
      },
    },

    {
      property: 'Status',
      select: {
        equals: 'Temperature Check',
      },
    },

    {
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
  ],
};

export default config;
