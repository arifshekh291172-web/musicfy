const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // REMOVE THIS (bug fix)
    // if (user.token !== token) { ... }

    req.user = user;
    req.token = token;
    next();

  } catch (err) {
    console.log("Auth Middleware Error:", err);
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};
