import { NanceConfig } from "@nance/nance-sdk";
import { DiscordHandler } from "../discordHandler";
import { sleep } from "../../utils";

const config = {
  discord: {
    API_KEY: "DISCORD_KEY_NANCE",
    channelIds: {
      bookkeeping: "1109230138182340648",
      proposals: "1109230138182340648",
      transactions: "1109230138182340648"
    },
    guildId: "1090064637858414633",
    poll: {
      minYesVotes: 1,
      yesNoRatio: 0.3,
      verifyRole: ""
    },
    reminder: {
      channelIds: [
        "1109230138182340648"
      ],
      imageNames: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ],
      imagesCID: "https://nance.infura-ipfs.io/ipfs/QmYQTMNwEHKxV8eA2VxRDcrKbYchALZCBbMSfKwgdDccTr/reminderImages",
      type: "basic"
    },
    roles: {
      governance: "1161441693116137576"
    }
  },
  dolt: {
    enabled: true,
    owner: "jigglyjams",
    repo: "waterbox"
  },
  ipfsGateway: "ipfs.nftstorage.link",
  juicebox: {
    gnosisSafeAddress: "0x047a03f0EE40Dd0E54FDccc702de02C93840F95A",
    governorAddress: "",
    network: "op mainnet",
    projectId: "1"
  },
  name: "waterbox",
  proposalIdPrefix: "JBP-",
  snapshot: {
    base: "https://juicetool.xyz/snapshot",
    choices: [
      "For",
      "Against",
      "Abstain"
    ],
    minTokenPassingAmount: 80000000,
    passingRatio: 0.66,
    space: "jigglyjams.eth"
  }
} as NanceConfig;

async function main() {
  const discord = new DiscordHandler(config);
  await sleep(1000);
  discord.getAlertChannel();
}

main();
