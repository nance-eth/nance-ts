import { NanceConfig } from "@nance/nance-sdk";

export const DEFAULT_DASHBOARD = "https://nance.app";

export const DOLTHUB_REMOTE_URL = "https://doltremoteapi.dolthub.com/nance";

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
  updateActionTracking: "updateActionTracking",
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

export const DEFAULT_CONFIG: NanceConfig = {
  name: "Nance",
  proposalIdPrefix: null,
  allowCurrentCycleSubmission: false,
  juicebox: {
    network: "mainnet",
    projectId: null,
    gnosisSafeAddress: null
  },
  discord: {
    API_KEY: "DISCORD_KEY_NANCE",
    guildId: null,
    roles: {
      governance: null
    },
    channelIds: {
      proposals: null,
      bookkeeping: null,
      transactions: null
    },
    poll: {
      minYesVotes: 10,
      yesNoRatio: 0.3
    },
    reminder: {
      channelIds: null,
      imagesCID: null,
      imageNames: null
    }
  },
  dolt: {
    enabled: false,
    owner: "nance",
    repo: null
  },
  snapshot: {
    space: null,
    choices: ["For", "Against", "Abstain"],
    minTokenPassingAmount: 1,
    passingRatio: 0.5
  }
};
