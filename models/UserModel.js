const { Sequelize } = require("sequelize");
const db = require("../config/database");

const User = db.define("user", {
  id: {
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
  },
  role: {
    type: Sequelize.ENUM,
    values: ["user", "admin"],
    defaultValue: "user",
  },
  hash: {
    type: Sequelize.STRING,
  },
});

module.exports = User;
