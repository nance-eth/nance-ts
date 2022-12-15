CREATE TABLE proposals (
  uuid VARCHAR(35) NOT NULL,
  createdTime DATETIME NOT NULL,
  lastEditedTime DATETIME NOT NULL,
  title VARCHAR(500) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  authorAddress CHAR(42),
  authorDiscordId CHAR(18),
  category VARCHAR(64) NOT NULL,
  proposalStatus VARCHAR(30) NOT NULL,
  proposalId INT,
  temperatureCheckVotes JSON,
  snapshotId VARCHAR(66),
  voteType VARCHAR(24) NOT NULL,
  choices JSON NOT NULL,
  snapshotVotes JSON,
  governanceCycle INT,
  discussionURL VARCHAR(500),
  PRIMARY KEY (uuid),
  INDEX title (title),
  INDEX createdTime (createdTime),
  INDEX authorAddress (authorAddress),
  INDEX authorDiscordId (authorDiscordId),
  INDEX category (category),
  INDEX proposalStatus (proposalStatus),
  INDEX proposalId (proposalId),
  INDEX snapshotId (snapshotId),
  INDEX voteType (voteType),
  INDEX governanceCycle (governanceCycle)
);

CREATE TABLE payouts (
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
  payProject INT,
  payStatus VARCHAR(35),
  PRIMARY KEY (uuid),
  INDEX payAddress (payAddress),
  INDEX payProject (payProject),
  INDEX governanceCycleStart (governanceCycleStart),
  INDEX payName (payName)
);

CREATE TABLE reserves (
  uuid VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  governanceCycleStart INT NOT NULL,
  lockedUntil INT,
  reserveName VARCHAR(255),
  reservePercentage INT,
  reserveAddress CHAR(42) NOT NULL,
  reserveStatus VARCHAR(35),
  PRIMARY KEY(uuid),
  INDEX reserveAddress (reserveAddress),
  INDEX reserveStatus (reserveStatus),
  INDEX governanceCycleStart (governanceCycleStart)
);

CREATE TABLE reconfigurations (
  uuid VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  JBFundingCycleData JSON NOT NULL,
  JBFundingCycleMetaData JSON NOT NULL,
  PRIMARY KEY (uuid)
);

CREATE TABLE governanceCycles (
  cycleNumber INT NOT NULL,
  startDatetime DATETIME NOT NULL,
  endDatetime DATETIME NOT NULL,
  jbV1FundingCycle INT,
  jbV2FundingCycle INT,
  jbV3FundingCycle INT,
  acceptingProposals BOOLEAN,
  PRIMARY KEY (cycleNumber)
);
