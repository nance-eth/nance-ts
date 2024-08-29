CREATE TABLE IF NOT EXISTS proposals (
  uuid VARCHAR(35) NOT NULL,
  createdTime DATETIME NOT NULL,
  lastEditedTime DATETIME NOT NULL,
  title VARCHAR(500) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  authorAddress CHAR(42),
  coauthors JSON,
  authorDiscordId CHAR(18),
  proposalStatus VARCHAR(30) NOT NULL,
  actionTracking JSON,
  proposalId INT,
  temperatureCheckVotes JSON,
  snapshotId VARCHAR(66),
  voteType VARCHAR(24) NOT NULL,
  choices JSON NOT NULL,
  snapshotVotes JSON,
  voteAddressCount INT,
  governanceCycle INT,
  discussionURL VARCHAR(500),
  ipfsCID VARCHAR(60),
  proposalSummary TEXT,
  threadSummary TEXT,
  signature VARCHAR(42),
  PRIMARY KEY (uuid)
);

CREATE TABLE IF NOT EXISTS payouts (
  uuidOfPayout VARCHAR(35) NOT NULL,
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
  PRIMARY KEY (uuidOfPayout)
);

CREATE TABLE IF NOT EXISTS reserves (
  id INT NOT NULL AUTO_INCREMENT,
  uuidOfReserve VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  reserveGovernanceCycle INT NOT NULL,
  splits JSON NOT NULL,
  reserveStatus VARCHAR(35),
  PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS transfers (
  uuidOfTransfer VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  transferGovernanceCycle INT NOT NULL,
  transferCount INT NOT NULL DEFAULT 1,
  transferName VARCHAR(255),
  transferAddress CHAR(42),
  transferTokenAddress CHAR(42),
  transferChainId INT,
  transferAmount VARCHAR(255),
  transferDecimals INT NOT NULL DEFAULT 18,
  transferStatus VARCHAR(35),
  PRIMARY KEY (uuidOfTransfer)
);

CREATE TABLE IF NOT EXISTS customTransactions (
  uuidOfTransaction VARCHAR(35) NOT NULL,
  uuidOfProposal VARCHAR(35),
  transactionGovernanceCycle INT NOT NULL,
  transactionCount INT NOT NULL DEFAULT 1,
  transactionName VARCHAR(255),
  transactionAddress CHAR(42),
  transactionChainId INT,
  transactionValue VARCHAR(255),
  transactionFunctionName VARCHAR(255),
  transactionFunctionArgs JSON,
  transactionStatus VARCHAR(35),
  transactionTenderlyId VARCHAR(40),
  PRIMARY KEY (uuidOfTransaction)
);

CREATE TABLE IF NOT EXISTS polls (
  id VARCHAR(64) NOT NULL,
  uuidOfProposal VARCHAR(35),
  answer BOOLEAN,
  createdTime DATETIME,
  updatedTime DATETIME,
  PRIMARY KEY (id)
);
