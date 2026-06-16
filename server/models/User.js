// server/models/User.js
//
// Thin wrapper around the users table. Keeping these as plain functions
// (not a class) keeps things simple — each one does one query.

const db = require("../config/db");

const User = {
  create({ name, email, passwordHash }) {
    const stmt = db.prepare(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
    );
    const result = stmt.run(name, email, passwordHash);
    return User.findById(result.lastInsertRowid);
  },

  findByEmail(email) {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  },

  findById(id) {
    return db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(id);
  },
};

module.exports = User;
