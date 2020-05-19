const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 8 requests per windowMs
});

//authentication page
router
  .get("/login", UserController.loginPage)
  .post("/login", authLimiter, UserController.login);

//logout
router.get("/logout", UserController.logout);

//register page
router
  .get("/register", UserController.registerPage)
  .post("/register", authLimiter, UserController.postRegister);

//forgot password page
router
  .get("/forgotPassword", UserController.forgotPassword)
  .post("/forgotPassword", authLimiter, UserController.resetPassword);

//reset password page
router
  .get("/confirmResetPassword", UserController.getConfirmPasswordReset)
  .post("/confirmResetPassword", UserController.postConfirmPasswordReset);

//index page
router.get("/", UserController.allowIfLoggedin, UserController.indexPage);

//users list, only admins have access
router.get(
  "/users",
  UserController.allowIfLoggedin,
  UserController.grantAccess("admin"),
  UserController.getUsers
);
module.exports = router;
