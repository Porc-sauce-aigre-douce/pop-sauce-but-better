require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
  }
}));

require('./auth/routes')(app);
require('./questions/routes')(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected');
});