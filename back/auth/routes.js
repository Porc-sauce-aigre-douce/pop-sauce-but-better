const { authMiddleware } = require('./middleware');
const { User } = require('../user/model');
const bcrypt = require('bcryptjs');

module.exports = (app) => {
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      const user = await User.create({ username, password: hashedPassword });
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Username already exists' });
    }
  }),
  
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
  }),
  
  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: 'This is a protected route' });
  }),
  
  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out, please try again' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  })
}