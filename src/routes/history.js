import express from "express";
import { History } from "../models/History.js";

export const historyRouter = express.Router();

// GET /api/history -> all history with optional pagination + filter by userId
historyRouter.get("/", async (req, res) => {
  try {
    let { limit = 10, page = 1, userId } = req.query;

    limit = Number(limit);
    page = Number(page);

    if (isNaN(limit) || limit <= 0) limit = 10;
    if (isNaN(page) || page <= 0) page = 1;

    const query = userId ? { userId } : {};

    const totalDocs = await History.countDocuments(query);

    const docs = await History.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      data: docs,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page * limit < totalDocs,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/history/:userId -> history for a specific user (no pagination)
historyRouter.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const docs = await History.find({ userId })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("Error fetching user history:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
