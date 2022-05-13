const config = {
  nameId: 'jbdao',
  name: 'juiceboxDAO',
  scheme: ['notion', 'discord', 'snapshot'],
  discord: {
    discord_guildId: '889377541675159602',
    discord_channelId: '964601032703352873',
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
    filters: {
      preDiscussion: {
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

      discussion: {
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

      proposalId: {
        property: null,
        rich_text: {
          contains: 'JBP-',
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
    },
  },
  snapshot: {
    base: 'https://snapshot.org/#',
    space: 'jigglyjams.eth',
    choices: ['For', 'Against', 'Abstain'],
    votingTimeDays: 3,
    quroum: 1,
    passingRatio: 0.66,
  },
  ipfsGateway: 'https://gateway.pinata.cloud/ipfs',
};

export default config;
