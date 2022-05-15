const express = require("express");
const { check } = require("express-validator");
const checkauth = require("../middleware/check-auth");
const usersController = require("../controllers/users-controllers");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/authenticate/signup",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post(
  "/authenticate/login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.login
);

router.post("/follow/:uid", checkauth, usersController.follow);
router.post("/unfollow/:uid", checkauth, usersController.unfollow);

module.exports = router;
