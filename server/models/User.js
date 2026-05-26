import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  likedSongs: [{
    type: String // saving the songId from JioSaavn API
  }],
  history: [{
    songId: String,
    title: String,
    image: String,
    artist: String,
    playedAt: {
      type: Date,
      default: Date.now
    }
  }],
  playlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playlist"
  }]
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
