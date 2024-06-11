const mongoose = require('mongoose');

module.exports = {
  User: mongoose.model(
    "users",
    new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
    })
  ),
};
