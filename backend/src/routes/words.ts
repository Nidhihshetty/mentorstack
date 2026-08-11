import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../../prisma/data/words.txt");
  try {
    const words = fs.readFileSync(filePath, "utf-8").split("\n").map(w => w.trim());
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: "Failed to load words.txt" });
  }
});

export default router;
