const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/auth-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/auth-system' }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
  }
}));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  const user = await User.findOne({ username });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  req.session.userId = user._id;

  if (rememberMe) {
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
  } else {
    req.session.cookie.expires = false; // Session cookie
  }

  res.json({ message: 'Logged in successfully' });
});

const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Access denied' });
  }
  next();
};

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out, please try again' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});