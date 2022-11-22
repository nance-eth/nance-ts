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
  uuidOfProposal VARCHAR(35) NOT NULL,
  treasuryVersion INT NOT NULL,
  governanceCycleStart INT NOT NULL,
  numberOfPayouts INT NOT NULL,
  lockedUntil INT,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payAddress CHAR(42),
  payProject INT,
  payStatus ENUM('voting', 'active', 'complete', 'cancelled'),
  PRIMARY KEY (uuidOfProposal),
  FOREIGN KEY (uuidOfProposal) REFERENCES proposals(uuid),
  INDEX payAddress (payAddress),
  INDEX payProject (payProject),
  INDEX governanceCycleStart (governanceCycleStart)
);

CREATE TABLE reserves (
  hashId CHAR(40) NOT NULL,
  uuidOfProposal VARCHAR(35),
  governanceCycleStart INT NOT NULL,
  lockedUntil INT,
  reserveName VARCHAR(255),
  reservePercentage INT,
  reserveAddress CHAR(42) NOT NULL,
  reserveStatus ENUM('voting', 'active', 'cancelled'),
  PRIMARY KEY(hashId),
  INDEX reserveAddress (reserveAddress),
  INDEX reserveStatus (reserveStatus),
  INDEX governanceCycleStart (governanceCycleStart)
);

CREATE TABLE reconfigurations (
  uuidOfProposal VARCHAR(35) NOT NULL,
  JBFundingCycleData JSON NOT NULL,
  JBFundingCycleMetaData JSON NOT NULL,
  PRIMARY KEY (uuidOfProposal),
  FOREIGN KEY (uuidOfProposal) REFERENCES proposals(uuid),
);

CREATE TABLE governanceCycles (
  cycleNumber INT NOT NULL,
  startDatetime DATETIME NOT NULL,
  endDatetime DATETIME NOT NULL,
  PRIMARY KEY (cycleNumber)
);
