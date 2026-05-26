import express from "express";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("playlists");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user" });
  }
});

router.post("/like", protect, async (req, res) => {
  try {
    const { songId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.likedSongs.includes(songId)) {
      user.likedSongs.push(songId);
      await user.save();
    }
    res.json(user.likedSongs);
  } catch (error) {
    res.status(500).json({ message: "Server error adding like" });
  }
});

router.post("/unlike", protect, async (req, res) => {
  try {
    const { songId } = req.body;
    const user = await User.findById(req.user.id);
    user.likedSongs = user.likedSongs.filter((id) => id !== songId);
    await user.save();
    res.json(user.likedSongs);
  } catch (error) {
    res.status(500).json({ message: "Server error removing like" });
  }
});

router.get("/liked", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.likedSongs);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching likes" });
  }
});

router.post("/history", protect, async (req, res) => {
  try {
    const songData = req.body; 
    const user = await User.findById(req.user.id);

    // Remove if already exists so we can move it to top
    user.history = user.history.filter((s) => s.songId !== songData.songId);
    
    // Add to beginning
    user.history.unshift(songData);

    // Limit to 50
    if (user.history.length > 50) {
      user.history.pop();
    }

    await user.save();
    res.json(user.history);
  } catch (error) {
    res.status(500).json({ message: "Server error saving history" });
  }
});

router.get("/history", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.history);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching history" });
  }
});

router.delete("/history", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.history = [];
    await user.save();
    res.json({ message: "History cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error clearing history" });
  }
});

export default router;
