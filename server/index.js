// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const { requireAuth } = require("./middleware/auth");
const { initWS } = require("./ws");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // serves frontend

app.use("/api/auth", authRoutes);
app.use("/api/tasks", requireAuth, taskRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
initWS(server); // attach WebSocket to the same HTTP server

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});