const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
    try {
        // 1. Safe extraction of token from cookies
        const token = req.cookies?.token;
        if (!token) {
            throw new Error("Authentication token is missing");
        }

        // 2. Check Redis blocklist FIRST to save DB calls if logged out
        const isBlocked = await redisClient.exists(`token:${token}`);
        if (isBlocked) {
            throw new Error("Token has been revoked or logged out");
        }

        // 3. Verify JWT signature & expiration
        const payload = jwt.verify(token, process.env.JWT_KEY);
        const { _id } = payload;

        if (!_id) {
            throw new Error("Invalid token payload");
        }

        // 4. Fetch user details from MongoDB (excluding password)
        const user = await User.findById(_id).select("-password");
        if (!user) {
            throw new Error("User account does not exist");
        }

        // 5. Attach user document to request object standardly
        req.user = user;

        next();
    } catch (err) {
        return res.status(401).json({
            error: "Unauthorized access",
            details: err.message
        });
    }
};

module.exports = userMiddleware;