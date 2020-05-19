const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const hbs = require("express-handlebars");
const Sequelize = require("sequelize");
const User = require("./models/UserModel");
const bcrypt = require("bcrypt");

//importing .env
require("dotenv").config();

//Setting up handlebars as the template engine
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultView: "default",
    layoutsDir: __dirname + "/views/layouts/",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.set("view engine", "hbs");

//setting bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
//setting cookieParser
app.use(cookieParser());
//serving static public folder
app.use(express.static("public"));

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

//authorization middleware
app.use(async (req, res, next) => {
  if (req.cookies["Authorization"]) {
    try {
      const accessToken = req.cookies["Authorization"];
      const { userId, exp } = await jwt.verify(
        accessToken,
        process.env.JWT_SECRET
      );

      // Check if token has expired
      if (exp < Date.now().valueOf() / 1000) {
        return res.status(401).json({
          error: "JWT token has expired, please login to obtain a new one",
        });
      }
      res.locals.loggedInUser = await User.findByPk(userId);
      next();
    } catch (error) {
      console.log(error);
      next();
    }
  } else {
    next();
  }
});

//database
const db = require("./config/database");
db.authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.log(err));

//create table if not exists
User.sync();
//create admin account
adminAccount = async () => {
  await User.findOrCreate({
    where: {
      username: "admin",
    },
    defaults: {
      name: "Admin Account",
      email: "admin@admin.com",
      password: await bcrypt.hash("administrator", 10),
      role: "admin",
    },
  });
};
adminAccount();

//routes
const routes = require("./routes/route");
app.use("/", routes);

//Setting the port
const PORT = process.env.PORT || 3000;

//Starting the server
const server = app.listen(PORT, (error) => {
  if (error) {
    console.log("Error starting the server");
  }
  console.log("This server is running on port", server.address().port);
});
