export const DEFAULT_DASHBOARD = "https://nance.app";

export const TASKS = {
  sendDailyAlert: "sendDailyAlert",
  temperatureCheckStartAlert: "temperatureCheckStartAlert",
  deleteTemperatureCheckStartAlert: "deleteTemperatureCheckStartAlert",
  temperatureCheckRollup: "temperatureCheckRollup",
  temperatureCheckEndAlert: "temperatureCheckEndAlert",
  deleteTemperatureCheckEndAlert: "deleteTemperatureCheckEndAlert",
  temperatureCheckClose: "temperatureCheckClose",
  voteSetup: "voteSetup",
  voteRollup: "voteRollup",
  voteQuorumAlert: "voteQuorumAlert",
  voteOneDayEndAlert: "voteOneDayEndAlert",
  voteEndAlert: "voteEndAlert",
  deleteVoteEndAlert: "deleteVoteEndAlert",
  voteClose: "voteClose",
  voteResultsRollup: "voteResultsRollup",
  incrementGovernanceCycle: "incrementGovernanceCycle",
  sendBookkeeping: "sendBookkeeping",
  commitAndPush: "commitAndPush",
};

export const EMOJI = {
  YES: "👍",
  NO: "👎",
  DISCUSSION: "💬",
  TEMPERATURE_CHECK: "🌡️",
  VOTE: "🗳️",
  APPROVED: "✅",
  CANCELLED: "❌",
};

// viem chain names
// ex: https://github.com/wevm/viem/blob/234f8c209fed23a2caa41fbc049909f24a14850f/src/chains/definitions/optimism.ts#L7
// TODO: use id instead of name
export const NETWORKS = {
  MAINNET: "ethereum",
  GOERLI: "goerli",
  OPTIMISM: "op mainnet",
  GNOSIS: "gnosis",
};

export const ONE_HOUR_SECONDS = 3600;
export const FIVE_MINUTES_SECONDS = 300;
export const ONE_DAY_SECONDS = 24 * 60 * 60;
export const ONE_DAY_MILLISECONDS = ONE_DAY_SECONDS * 1000;
