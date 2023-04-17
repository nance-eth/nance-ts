CREATE TABLE IF NOT EXISTS proposals (
  uuid VARCHAR(35) NOT NULL,
  createdTime DATETIME NOT NULL,
  lastEditedTime DATETIME NOT NULL,
  title VARCHAR(500) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  authorAddress CHAR(42),
  authorDiscordId CHAR(18),
  category VARCHAR(64),
  proposalStatus VARCHAR(30) NOT NULL,
  proposalId INT,
  temperatureCheckVotes JSON,
  snapshotId VARCHAR(66),
  voteType VARCHAR(24) NOT NULL,
  choices JSON NOT NULL,
  snapshotVotes JSON,
  voteAddressCount INT,
  governanceCycle INT,
  discussionURL VARCHAR(500),
  PRIMARY KEY (uuid)
);

CREATE TABLE IF NOT EXISTS payouts (
  uuid VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35) NOT NULL,
  treasuryVersion INT NOT NULL,
  governanceCycleStart INT NOT NULL,
  numberOfPayouts INT NOT NULL,
  lockedUntil INT,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payName VARCHAR(255),
  payAddress CHAR(42),
  payAllocator CHAR(42),
  payProject INT,
  payStatus VARCHAR(35),
  PRIMARY KEY (uuid)
);

CREATE TABLE IF NOT EXISTS reserves (
  uuid VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  governanceCycleStart INT NOT NULL,
  lockedUntil INT,
  reserveName VARCHAR(255),
  reservePercentage INT,
  reserveAddress CHAR(42) NOT NULL,
  reserveStatus VARCHAR(35),
  PRIMARY KEY(uuid)
);

CREATE TABLE IF NOT EXISTS transfers (
  uuid VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  governanceCycleStart INT NOT NULL,
  numberOfTransfers INT NOT NULL DEFAULT 1,
  transferName VARCHAR(255),
  transferAddress CHAR(42),
  transferTokenName VARCHAR(8),
  transferTokenAddress CHAR(42),
  transferAmount VARCHAR(255),
  transferDecimals INT NOT NULL DEFAULT 18,
  transferStatus VARCHAR(35),
  PRIMARY KEY (uuid)
);

CREATE TABLE IF NOT EXISTS reconfigurations (
  uuid VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  JBFundingCycleData JSON NOT NULL,
  JBFundingCycleMetaData JSON NOT NULL,
  PRIMARY KEY (uuid)
);

CREATE TABLE IF NOT EXISTS governanceCycles (
  cycleNumber INT NOT NULL,
  startDatetime DATETIME,
  endDatetime DATETIME,
  jbV1FundingCycle INT,
  jbV2FundingCycle INT,
  jbV3FundingCycle INT,
  acceptingProposals BOOLEAN,
  PRIMARY KEY (cycleNumber)
);
