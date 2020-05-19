const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const transporter = require("../transporter/transporter");
const User = require("../models/UserModel");

//encrypt the password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

//check if password matches
async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

//check if current user has enough permissions
exports.grantAccess = function (role) {
  return async (req, res, next) => {
    try {
      const userRole = res.locals.loggedInUser.role;
      if (userRole != role) {
        res
          .status(403)
          .json({ error: "You dont have permission to view this page" });
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
};
//check if logged in
exports.allowIfLoggedin = async (req, res, next) => {
  try {
    const user = res.locals.loggedInUser;

    if (!user) return res.redirect("/login");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

//render register page
exports.registerPage = async (req, res, next) => {
  res.render("register", { layout: "loginLayout" });
};

//render post
exports.postRegister = async (req, res, next) => {
  try {
    const { name, email, username, password, confirmPassword } = req.body;
    var data = { name, email, username };
    if (!name) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { name: "Name is required!" },
        data,
      });
    } else if (!email) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { email: "Email is required!" },
        data,
      });
    } else if (!username) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { username: "Username is required!" },
        data,
      });
    } else if (!password) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { password: "Password is required!" },
        data,
      });
    } else if (!confirmPassword) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { confirmPassword: "Confirm password is required!" },
        data,
      });
    }
    //check if email in use
    const userByEmail = await User.findOne({ where: { email } });
    if (userByEmail) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { email: "Email already in use!" },
        data,
      });
    }
    //check if username in use
    const userByUsername = await User.findOne({ where: { username } });
    if (userByUsername) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { username: "Username already in use!" },
        data,
      });
    }

    //check if username valid
    const minUsernameLength = 5;
    const maxUsernameLength = 12;
    if (!username.match(/^[0-9a-zA-Z]+$/)) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: {
          username: "Username must consist of alphanumeric characters!",
        },
        data,
      });
    } else if (
      username.length > maxUsernameLength &&
      username.length < minUsernameLength
    ) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: {
          username: `Username must be between ${minUsernameLength} and ${maxUsernameLength} characters!`,
        },
        data,
      });
    }
    //check if password valid
    const minPasswordLength = 6;
    if (password.length < minUsernameLength) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: {
          password: `Password must be at least ${minPasswordLength} characters!`,
        },
        data,
      });
    } else if (password != confirmPassword) {
      return res.status(400).render("register", {
        layout: "loginLayout",
        pageErrors: { confirmPassword: "Passwords dont match!" },
        data,
      });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
    });

    return res.status(400).render("register", {
      layout: "loginLayout",
      confirm: true,
    });
  } catch (error) {
    next(error);
  }
};

//render login page
exports.loginPage = async (req, res, next) => {
  res.render("login", {
    layout: "loginLayout",
  });
};

//logout
exports.logout = async (req, res, next) => {
  res.cookie("Authorization", "");
  res.redirect("/login");
};

//login post method
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user)
      return res.status(400).render("login", {
        layout: "loginLayout",
        pageErrors: { username: "User does not exist!" },
      });
    const validPassword = await validatePassword(password, user.password);
    if (!validPassword)
      return res.status(400).render("login", {
        layout: "loginLayout",
        pageErrors: { password: "Wrong password!" },
      });
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("Authorization", accessToken, {
      secure: false,
      httpOnly: true,
    });
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};
exports.indexPage = async (req, res, next) => {
  res.render("index", {
    layout: "mainLayout",
    user: res.locals.loggedInUser.toJSON(),
  });
};

exports.getUsers = async (req, res, next) => {
  users = await User.findAll();
  res.render("users", {
    layout: "mainLayout",
    users: users.map((user) => user.toJSON()),
  });
};

//display forgot passsword page
exports.forgotPassword = async (req, res, next) => {
  res.render("forgotPassword", {
    layout: "loginLayout",
  });
};

//method to generate a link for recovering password and sending it to user email
exports.resetPassword = async (req, res, next) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render("forgotPassword", {
        layout: "loginLayout",
        pageErrors: {
          email: "Email does not exist",
        },
      });
    } else {
      const random = (Math.random() * Math.floor(1000)).toString();
      const hash = await bcrypt.hash(random, 10);
      user.update({ hash });

      const link = `${req.protocol}://${req.get(
        "host"
      )}/confirmResetPassword?token=${user.hash}&&id=${user.id}`;
      transporter.resetPassword(link, user.email);

      return res.render("forgotPassword", {
        layout: "loginLayout",
        confirm: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

//render the page to confirm password reset
exports.getConfirmPasswordReset = async (req, res, next) => {
  const reqToken = req.query.token;
  const userId = req.query.id;
  var token;
  var user;
  try {
    if (reqToken && userId) {
      user = await User.findOne({ where: { hash: reqToken, id: userId } });
      if (user) {
        res.render("resetPassword", {
          layout: "loginLayout",
          reqToken: reqToken,
          userId: userId,
        });
      } else {
        res.status(400).json({ message: "Bad Request" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: "Bad Request" });
  }
};
//reset password
exports.postConfirmPasswordReset = async (req, res, next) => {
  const reqToken = req.query.token;
  const userId = req.query.id;
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  try {
    user = await User.findOne({ where: { hash: reqToken, id: userId } });
    if (user) {
      if (!newPassword) {
        res.status(400).render("resetPassword", {
          layout: "loginLayout",
          reqToken: reqToken,
          userId: userId,
          pageErrors: { newPassword: "Please enter the new password!" },
        });
      } else if (newPassword.length < 6) {
        res.status(400).render("resetPassword", {
          layout: "loginLayout",
          reqToken: reqToken,
          userId: userId,
          pageErrors: { newPassword: "Password too short!" },
        });
      } else if (!confirmPassword) {
        res.status(400).render("resetPassword", {
          layout: "loginLayout",
          reqToken: reqToken,
          userId: userId,
          pageErrors: { confirmPassword: "Please confirm the new password!" },
        });
      } else if (!(newPassword == confirmPassword)) {
        res.status(400).render("resetPassword", {
          layout: "loginLayout",
          reqToken: reqToken,
          userId: userId,
          pageErrors: { confirmPassword: "Passwords dont match!" },
        });
      } else {
        user = await User.findByPk(userId);
        user.password = await hashPassword(newPassword);
        user.hash = "";
        await user.save();

        res.status(200).json({ message: "Password updated" });
      }
    } else {
      res.status(400).json({ message: "Bad Request" });
    }
  } catch (error) {
    res.status(400).json({ message: "Bad Request" });
  }
};
