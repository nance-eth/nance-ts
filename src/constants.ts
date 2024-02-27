export const EVENTS = {
  TEMPERATURE_CHECK: 'Temperature Check',
  SNAPSHOT_VOTE: 'Snapshot Vote',
  EXECUTION: 'Execution',
  DELAY: 'Delay',
};

export const STATUS = {
  DRAFT: 'Draft',
  DISCUSSION: 'Discussion',
  TEMPERATURE_CHECK: EVENTS.TEMPERATURE_CHECK,
  VOTING: 'Voting',
  APPROVED: 'Approved',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
  PRIVATE: 'Private',
  ACTION: {
    ACTIVE: 'active',
    COMPLETE: 'complete',
    CANCELLED: 'cancelled',
    VOTING: 'voting',
    PAUSED: 'paused',
  }
};

export const TASKS = {
  sendDailyAlert: 'sendDailyAlert',
  sendDailyJBAlert: 'sendDailyJBAlert',
  temperatureCheckStartAlert: 'temperatureCheckStartAlert',
  deleteTemperatureCheckStartAlert: 'deleteTemperatureCheckStartAlert',
  temperatureCheckRollup: 'temperatureCheckRollup',
  temperatureCheckEndAlert: 'temperatureCheckEndAlert',
  deleteTemperatureCheckEndAlert: 'deleteTemperatureCheckEndAlert',
  temperatureCheckClose: 'temperatureCheckClose',
  voteSetup: 'voteSetup',
  voteRollup: 'voteRollup',
  voteQuorumAlert: 'voteQuorumAlert',
  voteOneDayEndAlert: 'voteOneDayEndAlert',
  voteEndAlert: 'voteEndAlert',
  deleteVoteEndAlert: 'deleteVoteEndAlert',
  voteClose: 'voteClose',
  voteResultsRollup: 'voteResultsRollup',
  incrementGovernanceCycle: 'incrementGovernanceCycle',
  sendBookkeeping: 'sendBookkeeping',
};

export const EMOJI = {
  YES: '👍',
  NO: '👎',
  VOTE: '🗳️',
  APPROVED: '✅',
  CANCELLED: '❌',
};

// viem chain names
// ex: https://github.com/wevm/viem/blob/234f8c209fed23a2caa41fbc049909f24a14850f/src/chains/definitions/optimism.ts#L7
// TODO: use id instead of name
export const NETWORKS = {
  MAINNET: 'ethereum',
  GOERLI: 'goerli',
  OPTIMISM: 'op mainnet',
  GNOSIS: 'gnosis',
};

export const ONE_HOUR_SECONDS = 3600;
export const FIVE_MINUTES_SECONDS = 300;
export const ONE_DAY_SECONDS = 24 * 60 * 60;
export const ONE_DAY_MILLISECONDS = ONE_DAY_SECONDS * 1000;
