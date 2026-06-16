// server/routes/auth.js
//
// Two endpoints:
//   POST /api/auth/signup  — create a new account
//   POST /api/auth/login   — verify credentials, return a JWT
//
// Passwords are never stored as plain text — bcrypt hashes them with a
// random "salt" baked in, so even if the database leaked, the raw
// passwords aren't directly readable.

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

const router = express.Router();

const SALT_ROUNDS = 10; // higher = slower but more secure; 10 is a sane default

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are all required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = User.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = User.create({ name, email, passwordHash });

  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const userRow = User.findByEmail(email);
  if (!userRow) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, userRow.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = { id: userRow.id, name: userRow.name, email: userRow.email };
  const token = signToken(user);
  res.json({ token, user });
});

module.exports = router;
