// server/config/db.js
//
// Sets up a single SQLite database file on disk and creates the tables
// we need if they don't already exist. We use node:sqlite — SQLite
// support built directly into Node.js itself (Node 22.5+) — instead of
// a third-party package like better-sqlite3, which needs a C++ compiler
// toolchain to install on some machines (Visual Studio on Windows, Xcode
// on Mac). node:sqlite needs nothing extra: it ships inside Node.
// It's also synchronous, same as better-sqlite3, so no .then()/await
// needed for queries.

const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "taskapp.db");
const db = new DatabaseSync(dbPath);

// SQLite has foreign key enforcement OFF by default — without this,
// the "ON DELETE CASCADE" in the tasks table below would be silently
// ignored.
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;
