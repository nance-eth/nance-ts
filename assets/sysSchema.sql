CREATE TABLE IF NOT EXISTS config (
  space VARCHAR(255) NOT NULL,
  displayName VARCHAR(255),
  spaceOwners JSON,
  cid CHAR(59),
  config JSON,
  calendar JSON,
  lastUpdated DATETIME,
  cycleTriggerTime TIME,
  cycleStageLengths JSON DEFAULT '[]',
  dialogHandlerMessageIds JSON DEFAULT '{}',
  currentGovernanceCycle INT,
  autoEnable BOOLEAN,
  -- template JSON,
  proposalCount INT,
  PRIMARY KEY(space)
);
