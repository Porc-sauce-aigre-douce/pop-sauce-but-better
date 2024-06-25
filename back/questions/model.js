const mongoose = require('mongoose');

module.exports = {
  Question: mongoose.model(
    "question",
    new mongoose.Schema({
      wording: { type: String, required: true },
      answers: { type: [String] },
      correctAnswers: { type: [String], required: true },
    })
  ),
};
