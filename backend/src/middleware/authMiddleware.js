const jwt = require("jsonwebtoken");
const prisma = require('../prisma');
const { getRequiredEnv } = require('../config/env');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  try {
    const decoded = jwt.verify(token, getRequiredEnv('JWT_SECRET'));
    const userId = Number(decoded.userId);

    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    let role = decoded.role;

    if (!role) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      role = user.role;
    }

    req.user = { userId, role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
