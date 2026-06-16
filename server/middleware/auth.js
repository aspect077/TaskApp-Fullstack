// server/middleware/auth.js
//
// Two things live here:
// 1. A helper to create a JWT when a user logs in/signs up.
// 2. Express middleware that checks incoming requests for a valid JWT
//    and blocks them if it's missing or invalid. Any route that needs
//    "you must be logged in" protection uses this middleware.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  // Only put non-sensitive, small data in the token payload — it's
  // base64-encoded, not encrypted, so anyone can read it (they just
  // can't forge a valid signature without the secret).
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization; // expected format: "Bearer <token>"
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed authorization header" });
  }

  const token = header.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id; // routes downstream can read req.userId
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { signToken, requireAuth };
