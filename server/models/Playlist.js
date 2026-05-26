import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  songs: [{
    id: String,
    songId: String,
    title: String,
    image: String,
    artist: String,
    duration: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

export const Playlist = mongoose.model("Playlist", playlistSchema);
