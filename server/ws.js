// server/ws.js
const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");

const clients = new Map(); // userId -> Set of WebSocket connections

function initWS(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let userId = null;

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data);

        if (msg.type === "auth") {
          try {
            const payload = jwt.verify(msg.token, process.env.JWT_SECRET);
            userId = payload.id; // matches what signToken() puts in the token
            if (!clients.has(userId)) clients.set(userId, new Set());
            clients.get(userId).add(ws);
            ws.send(JSON.stringify({ type: "auth_success" }));
          } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
            ws.close();
          }
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: "error", message: "Bad message format" }));
      }
    });

    ws.on("close", () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
      }
    });
  });
}

function broadcastToUser(userId, payload) {
  if (!clients.has(userId)) return;
  const message = JSON.stringify(payload);
  clients.get(userId).forEach((ws) => {
    if (ws.readyState === 1) ws.send(message);
  });
}

module.exports = { initWS, broadcastToUser };