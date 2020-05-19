const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");

//authentication page
router
  .get("/login", UserController.loginPage)
  .post("/login", UserController.login);

//logout
router.get("/logout", UserController.logout);

//register page
router
  .get("/register", UserController.registerPage)
  .post("/register", UserController.postRegister);

//forgot password page
router
  .get("/forgotPassword", UserController.forgotPassword)
  .post("/forgotPassword", UserController.resetPassword);

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
