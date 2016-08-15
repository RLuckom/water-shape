CREATE TABLE IF NOT EXISTS sequenceTypes (
  sequenceId NUMBER PRIMARY KEY,
  sequenceTypeName TEXT,
  UNIQUE (sequenceTypeName)
);

INSERT OR IGNORE INTO sequenceTypes (sequenceId, sequenceTypeName) VALUES (1, "DURATION");
INSERT OR IGNORE INTO sequenceTypes (sequenceId, sequenceTypeName) VALUES (2, "TIME");

CREATE TABLE IF NOT EXISTS sequences (
  uid TEXT PRIMARY KEY,
  dateCreated TEXT,
  sequenceType NUMBER,
  defaultState NUMBER,
  FOREIGN KEY(sequenceType) REFERENCES sequenceTypes(sequenceId)
);

CREATE TABLE IF NOT EXISTS gpioPins (
  pinNumber NUMBER PRIMARY KEY,
  sequenceUid TEXT,
  FOREIGN KEY(sequenceUid) REFERENCES sequences(uid)
);

INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (14, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (15, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (18, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (23, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (24, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (25, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (8, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (7, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (2, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (3, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (4, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (17, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (27, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (22, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (10, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (9, null);
INSERT OR IGNORE INTO gpioPins (pinNumber, sequenceUid) VALUES (11, null);

CREATE TABLE IF NOT EXISTS sequenceItems (
  uid TEXT PRIMARY KEY,
  dateCreated TEXT,
  sequenceUid TEXT,
  durationSeconds NUMBER,
  ordinal NUMBER,
  startTime TEXT,
  endTime TEXT,
  state TEXT,
  UNIQUE (sequenceUid, ordinal),
  FOREIGN KEY(sequenceUid) REFERENCES sequences(uid),
  FOREIGN KEY(sequenceType) REFERENCES sequenceTypes(sequenceId)
);

