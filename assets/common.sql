CREATE TABLE IF NOT EXISTS proposals (
  snapshotId VARCHAR(66),
  snapshotSpace VARCHAR(255),
  title VARCHAR(500),
  body MEDIUMTEXT,
  authorAddress VARCHAR(42),
  discussionURL VARCHAR(500),
  startTimestamp INT,
  endTimestamp INT,
  proposalSummary TEXT,
  PRIMARY KEY (snapshotId)
);
