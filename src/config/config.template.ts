const config = {
  nameId: null,
  name: null,
  scheme: null,
  discord: {
    guildId: null,
    channelId: null,
    alertRole: null,
    poll: {
      votingTimeDays: null,
      voteYesEmoji: null,
      voteNoEmoji: null,
      voteGoVoteEmoji: null,
      voteCanceledEmoji: null,
      minYesVotes: null,
      yesNoRatio: null,
      showResults: null
    },
  },
  notion: {
    publicURLPrefix: null,
    database_id: null,
    propertyKeys: {
      proposalId: null,
      proposalIdPrefix: null,
      discussionThread: null,
      ipfs: null,
    },
    filters: {
      preDiscussion: {
        and: [
          {
            property: null,
            select: {
              equals: null,
            },
          },
          {
            url: {
              is_empty: true,
            },
            property: null,
          },
          {
            property: 'Name',
            title: {
              is_not_empty: null
            }
          }],
      },

      discussion: {
        and: [
          {
            property: null,
            select: {
              equals: null,
            },
          },
          {
            property: null,
            url: {
              is_not_empty: null,
            },
          },
          {
            property: 'Name',
            title: {
              is_not_empty: null
            }
          }],
      },

      proposalId: {
        property: null,
        rich_text: {
          contains: null,
        },
      },

      temperatureCheck: {
        property: null,
        select: {
          equals: null,
        },
      },

      voting: {
        and: [
          {
            property: null,
            select: {
              equals: null,
            },
          },
          {
            property: null,
            url: {
              is_not_empty: null,
            },
          }],
      },
    },
  },
  snapshot: {
    base: 'https://snapshot.org/#',
    space: null,
    choices: ['For', 'Against', 'Abstain'],
    votingTimeDays: null,
    quroum: null,
    passingRatio: null,
  },
};

export default config;
