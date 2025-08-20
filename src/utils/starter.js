import mongoose from "mongoose";
import "dotenv/config";
import { User } from "../models/User.js";

async function starter() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log("Users already exist, skipping seed.");
    return;
  }

  const names = [
    "Rahul", "Kamal", "Sanak", "Aditi", "Neha",
    "Vikas", "Priya", "Aman", "Rohit", "Swati"
  ];

  await User.insertMany(names.map(name => ({ name })));
  console.log("✅ Seeded 10 users.");
}

// --- Run directly ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await starter();
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
