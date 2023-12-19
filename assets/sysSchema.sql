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
  autoEnable BOOLEAN,
  PRIMARY KEY(space)
);
