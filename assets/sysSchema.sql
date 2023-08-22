CREATE TABLE IF NOT EXISTS config (
  space VARCHAR(255) NOT NULL,
  spaceOwners JSON,
  cid CHAR(59),
  config JSON,
  calendar VARCHAR(16384),
  lastUpdated DATETIME,
  cycleLastUpdated DATETIME,
  cycleCurrentDay INT,
  cycleTriggerTime TIME,
  cycleStageLengths JSON DEFAULT '[]',
  dialogHandlerMessageIds JSON DEFAULT '{}',
  PRIMARY KEY(space)
);
