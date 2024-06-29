const { authMiddleware } = require('../auth/middleware');
const { User } = require('./model');

module.exports = (app) => {
  app.get('/user', authMiddleware, (req, res) => {
    User.findById(req.session.userId).then(user => {
      res.json({ username: user.username, id: user._id });
    });
  });
}