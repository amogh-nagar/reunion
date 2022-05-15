const crypto = require("crypto");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }
  let hashedpassword;
  try {
    hashedpassword = await bcrypt.hash(password, 10);
  } catch (err) {
    const error = new HttpError("Could not create user", 500);
    return next(error);
  }
  const createdUser = new User({
    
    email,
    password: hashedpassword,
    Posts: [],
    followers: [],
    following: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Could not Sign up.", 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Loggin in failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  let ismatched;
  try {
    ismatched = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new Error(
      "Could not log you in, Some error might be occurred",
      500
    );
    return next(error);
  }
  if (!ismatched) {
    const err = new Error("Invalid credentials", 422);
    return next(err);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET
      ,{
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Could not log you in.", 500);
    return next(error);
  }
  res.status(201).json({
    message: "Logged in!",
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

const follow = async (req, res, next) => {
  let existingUser;

  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Following failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  let tofollow = req.params.uid;
  var x;
  try {
    x = await User.findById(tofollow);
  } catch (err) {
    const error = new HttpError(
      "Following failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!x) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  existingUser.following.push(x);
  x.followers.push(existingUser);
  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  try {
    await x.save();
  } catch (err) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  res.status(200).json({
    message: "Folowingl succesfully",
  });
};

const unfollow = async (req, res, next) => {
  let existingUser;

  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Following failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  let tofollow = req.params.uid;
  var x;
  try {
    x = await User.findById(tofollow);
  } catch (err) {
    const error = new HttpError(
      "Following failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!x) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  existingUser.following.pull(x);
  x.followers.pull(existinguser);
  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  try {
    await x.save();
  } catch (err) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }
  res.status(200).json({
    message: "UnFolowing succesfully",
  });
};

exports.follow = follow;
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.unfollow = unfollow;
