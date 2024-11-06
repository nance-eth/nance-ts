INSERT INTO config (
  space,
  displayName,
  spaceOwners,
  cid,
  config,
  cycleStartReference,
  lastUpdated,
  cycleStageLengths,
  dialogHandlerMessageIds,
  currentGovernanceCycle,
  autoEnable,
  proposalCount
) VALUES (
  'waterbox',
  'waterbox',
  JSON_ARRAY(
    '0x25910143C255828F623786f46fe9A8941B7983bB',
    '0xca6Ed3Fdc8162304d7f1fCFC9cA3A81632d5E5B0',
    '0xf7253A0E87E39d2cD6365919D4a3D56D431D0041',
    '0xDEADBEEFdeadbeefDEADBEEFdeadbeefDEADBEEF'
  ),
  'QmWkrNRjX7EuaNdviUYKYaasC4wUxAmP65n3wkbK4VDe8V',
  '{\"allowCurrentCycleSubmission\":true,\"discord\":{\"API_KEY\":\"DISCORD_KEY_NANCE\",\"channelIds\":{\"bookkeeping\":\"1109230138182340648\",\"proposals\":\"1109230138182340648\",\"transactions\":\"1109230138182340648\"},\"guildId\":\"1090064637858414633\",\"poll\":{\"minYesVotes\":1,\"verifyRole\":\"1090065137546834051\",\"yesNoRatio\":0.3},\"reminder\":{\"channelIds\":[\"1109230138182340648\"],\"imageNames\":[\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"10\",\"11\",\"12\",\"13\",\"14\"],\"imagesCID\":\"https://nance.infura-ipfs.io/ipfs/QmYQTMNwEHKxV8eA2VxRDcrKbYchALZCBbMSfKwgdDccTr/reminderImages\",\"type\":\"image\"},\"roles\":{\"governance\":\"1161441693116137576\"}},\"dolt\":{\"enabled\":true,\"owner\":\"jigglyjams\",\"repo\":\"waterbox\"},\"ipfsGateway\":\"ipfs.nftstorage.link\",\"juicebox\":{\"gnosisSafeAddress\":\"0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e\",\"network\":\"mainnet\",\"projectId\":\"1\"},\"name\":\"waterbox\",\"proposalIdPrefix\":\"JBP-\",\"proposalSubmissionValidation\":{\"metStatus\":\"Discussion\",\"minBalance\":1,\"notMetStatus\":\"Draft\",\"type\":\"snapshot\"},\"snapshot\":{\"base\":\"https://juicetool.xyz/snapshot\",\"choices\":[\"For\",\"Against\",\"Abstain\"],\"minTokenPassingAmount\":80000000,\"passingRatio\":0.66,\"space\":\"jigglyjams.eth\"}}',
  '2024-01-24 00:00:00',
  '2024-05-09 15:29:57',
  JSON_ARRAY(3, 4, 4, 3),
  '{\"temperatureCheckEndAlert\":\"\",\"temperatureCheckRollup\":\"1273464855277338645\",\"temperatureCheckStartAlert\":\"1185355612058558616\",\"voteEndAlert\":\"\",\"voteOneDayEndAlert\":\"1177398180153921647\",\"voteQuorumAlert\":\"\",\"voteResultsRollup\":\"\",\"voteRollup\":\"\",\"votingEndAlert\":\"\",\"votingResultsRollup\":\"\",\"votingRollup\":\"\"}',
  1,
  0,
  0
);
