import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    points: { type: Number, required: true, min: 1, max: 10 },
    claimedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const History = mongoose.model("History", historySchema);
