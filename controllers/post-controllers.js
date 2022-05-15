const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/user");
const getPostById = async (req, res, next) => {
  const PostId = req.params.pid;

  let post;
  try {
    post = await Post.findById(PostId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a Post.",
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError(
      "Could not find Post for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ Post: post.toObject({ getters: true }) });
};

const getallPosts = async (req, res, next) => {
  const userId = req.userData.userId;
  let userWithPosts;
  try {
    userWithPosts = await Post.find(
      { creator: mongoose.Types.ObjectId(userId) },
      null,
      { sort: { createdTime: 1 } }
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching Posts failed, please try again later.",
      500
    );
    return next(error);
  }
  res.status(200).json({
    Posts: userWithPosts,
  });
};

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;

  const createdPost = new Post({
    title,
    description,
    creator: req.userData.userId,
    likedby: [],
    comments: [],
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating Post failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPost.save({ session: sess });
    user.Posts.push(createdPost);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating Post failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({
    PostId: createdPost.id,
    title: createdPost.title,
    description: createdPost.description,
    createdTime: createdPost.createdTime,
  });
};

const likePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const PostId = req.params.pid;

  let post;
  try {
    post = await Post.findById(PostId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }
  if (!post) {
    const error = new HttpError("Could not find post for provided id.", 404);
    return next(error);
  }
  if (post.likedby.includes(req.userData.userId)) {
    const error = new HttpError("Already liked.", 404);
    return next(error);
  }
  post.likedby.push(req.userData.userId);
  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Liked succefully" });
};

const unlikePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const PostId = req.params.pid;

  let post;
  try {
    post = await Post.findById(PostId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }
  if (!post) {
    const error = new HttpError("Could not find post for provided id.", 404);
    return next(error);
  }
  if (!post.likedby.includes(req.userData.userId)) {
    const error = new HttpError("Not liked.", 404);
    return next(error);
  }
  var idx = post.likedby.indexOf(req.userData.userId);
  post.likedby.splice(idx, 1);
  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "UnLiked succefully" });
};

const addComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { text } = req.body;
  const PostId = req.params.pid;

  let post;
  try {
    post = await Post.findById(PostId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError("Could not find post for provided id.", 404);
    return next(error);
  }
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating Post failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  const comment = new Comment({
    text,
    creator: req.userData.userId,
  });
  post.comments.push(comment);
  try {
    await comment.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Post.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Comment succefully added" });
};

const deletePost = async (req, res, next) => {
  const PostId = req.params.pid;

  let post;
  try {
    post = await Post.findById(PostId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete Post.",
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError("Could not find Post for this id.", 404);
    return next(error);
  }
  if (post.creator.id !== req.userData.userId) {
    const error = new HttpError("Not authorized", 401);
    return next(error);
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    post.creator.Posts.pull(post);
    await post.creator.save({ session: sess });

    await post.remove({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete Post.",
      500
    );
    return next(error);
  }
  res.status(200).json({ message: "Deleted Post." });
};

exports.getPostById = getPostById;
exports.getallPosts = getallPosts;
exports.createPost = createPost;
exports.addComment = addComment;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
exports.deletePost = deletePost;
