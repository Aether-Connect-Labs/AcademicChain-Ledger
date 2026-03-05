
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  student_id TEXT,
  degree TEXT,
  major TEXT,
  institution_id TEXT,
  issue_date TEXT,
  expiration_date TEXT,
  token_id TEXT,
  serial_number TEXT,
  blockchain_tx TEXT,
  ipfs_hash TEXT,
  status TEXT DEFAULT 'issued',
  network TEXT DEFAULT 'hedera', -- hedera, xrp, algorand
  metadata TEXT
);
