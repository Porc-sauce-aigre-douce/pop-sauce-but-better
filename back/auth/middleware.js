module.exports = {
  authMiddleware: (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Access denied' });
    }
    next();
  }
};