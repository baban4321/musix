import express from "express";
import { Playlist } from "../models/Playlist.js";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Playlist name is required" });

    const newPlaylist = await Playlist.create({
      userId: req.user.id,
      name,
      songs: []
    });

    // Add to user
    const user = await User.findById(req.user.id);
    user.playlists.push(newPlaylist._id);
    await user.save();

    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(500).json({ message: "Server error creating playlist" });
  }
});

router.post("/add-song", protect, async (req, res) => {
  try {
    const { playlistId, songData } = req.body;
    const songId = songData?.id || songData?.songId;

    if (!songId) {
      return res.status(400).json({ message: "Song id is required" });
    }
    
    const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user.id });
    if (!playlist) return res.status(404).json({ message: "Playlist not found or unauthorized" });

    // Check if song already exists in playlist
    if (!playlist.songs.find(s => (s.id || s.songId) === songId)) {
      playlist.songs.push({
        ...songData,
        id: songId,
        songId,
      });
      await playlist.save();
    }

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: "Server error adding song to playlist" });
  }
});

router.get("/user", protect, async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching playlists" });
  }
});

export default router;
