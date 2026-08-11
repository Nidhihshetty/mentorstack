// backend/src/routes/wordle.ts
import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/daily", (req, res) => {
  const filePath = path.join(__dirname, "../../prisma/data/words.txt");
  const words = fs.readFileSync(filePath, "utf-8").split("\n").map(w => w.trim()).filter(Boolean);

  // Better daily word selection - use days since epoch for consistency
  const today = new Date();
  const epoch = new Date('2021-06-19'); // Wordle's launch date
  const daysSinceEpoch = Math.floor((today.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const word = words[daysSinceEpoch % words.length].toLowerCase();

  res.json({ word });
});

export default router;
