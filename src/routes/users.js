import express from "express";
import { User } from "../models/User.js";
import { History } from "../models/History.js";

export function usersRouter(io) {
  const router = express.Router();

  // GET /api/users -> leaderboard (sorted, with rank)
router.get("/", async (req, res) => {
  try {
    // page & limit from query params (default: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // skip formula
    const skip = (page - 1) * limit;

    // fetch total count first
    const totalUsers = await User.countDocuments();

    // fetch paginated + sorted users
    const users = await User.find()
      .sort({ totalPoints: -1, createdAt: 1 }) // leaderboard style
      .skip(skip)
      .limit(limit)
      .lean();

    // Add global rank (not just local to page)
    const ranked = users.map((u, idx) => ({
      ...u,
      rank: skip + idx + 1, // continues from previous page
    }));

    res.json({
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      users: ranked,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

  // POST /api/users -> add user
  router.post("/", async (req, res) => {
    const { name } = req.body || {};
    console.log(name)
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });

    try {
      const user = await User.create({ name: name.trim() });
      // Broadcast leaderboard change
      io.emit("leaderboard:update");
      res.status(201).json(
        {
          user,
          message: "new user added!"
        }
      );
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "User name already exists" });
      }
      console.error(err);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // POST /api/claim/:userId -> claim random 1..10 points
  router.post("/claim/:userId", async (req, res) => {
    const { userId } = req.params;
    const points = Math.floor(Math.random() * 10) + 1; // 1..10

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.totalPoints += points;
      await user.save();
      
      const history = await History.create([{ userId: user._id, points }]);

      // Notify all clients to refresh leaderboard
      io.emit("leaderboard:update");

      res.json({
        message: "Points claimed",
        awarded: points,
        user: { _id: user._id, name: user.name, totalPoints: user.totalPoints },
        history: history[0]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to claim points" });
    }
  });

  return router;
}
