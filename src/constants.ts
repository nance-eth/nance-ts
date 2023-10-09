export const EVENTS = {
  TEMPERATURE_CHECK: 'Temperature Check',
  SNAPSHOT_VOTE: 'Snapshot Vote',
  EXECUTION: 'Execution',
  DELAY: 'Delay',
  NULL: 'NULL',
};

export const STATUS = {
  DRAFT: 'Draft',
  DISCUSSION: 'Discussion',
  TEMPERATURE_CHECK: 'Temperature Check',
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
  deleteTemperatureEndAlert: 'deleteTemperatureEndAlert',
  temperatureCheckClose: 'temperatureCheckClose',
  voteSetup: 'voteSetup',
  voteRollup: 'voteRollup',
  voteQuorumAlert: 'voteQuorumAlert',
  voteEndAlert: 'voteEndAlert',
  deleteVoteEndAlert: 'deleteVoteEndAlert',
  voteClose: 'voteClose',
  voteResultsRollup: 'voteResultsRollup',
  incrementGovernanceCycle: 'incrementGovernanceCycle',
  sendBookkeeping: 'sendBookkeeping',
};

export const ONE_HOUR_SECONDS = 3600;
export const FIVE_MINUTES_SECONDS = 300;
export const ONE_DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
