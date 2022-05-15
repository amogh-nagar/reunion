const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  likedby: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  comments:[{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
  createdTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", PostSchema);
