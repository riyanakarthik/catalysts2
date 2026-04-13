const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("Auth middleware hit"); // 👈 ADD THIS

  const authHeader = req.headers.authorization;

  console.log("Header:", authHeader); // 👈 ADD THIS

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message); // 👈 ADD THIS
    return res.status(401).json({ error: "Invalid token" });
  }
};