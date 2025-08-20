import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { usersRouter } from "./routes/users.js";
import { historyRouter } from "./routes/history.js";

const allowedOrigins = [
  "http://localhost:5173",
  "https://3w-assignment-frontend.vercel.app"
];

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI

// Routes
app.use("/api/users", usersRouter(io));
app.use("/api/history", historyRouter);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Socket.io
io.on("connection", (socket) => {
  console.log("🔌 client connected", socket.id);
  socket.on("disconnect", () => console.log("🔌 client disconnected", socket.id));
});

// Start
(async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Mongo connection error:", err);
    process.exit(1);
  }
})();
