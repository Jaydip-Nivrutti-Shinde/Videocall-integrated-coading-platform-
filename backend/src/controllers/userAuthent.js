const User = require('../models/user');
const validate = require('../utils/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const register = async (req, res) => {
    try {
        // 1. Check if body exists
        // if (!req.body || Object.keys(req.body).length === 0) {
        //     return res.status(400).json({ error: "Request body is missing or empty" });
        // }

        // // 2. Validate body schema
        // validate(req.body);


        const { firstName, email, password } = req.body;

        // 3. Guard against missing password field
        if (!password) {
            return res.status(400).json({ error: "Password field is required" });
        }

        // 4. Hash password safely
        const hashedPassword = await bcrypt.hash(password, 10);
        req.body.role = 'user';
        const user = await User.create({
            ...req.body,
            password: hashedPassword
        });

        const token = jwt.sign(
            { _id: user._id,email: user.email, role:'user' },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
        });

        return res.status(201).json({
            message: "User created successfully",
            user: { _id: user._id, firstName: user.firstName, email: user.email }
        });

    } catch (err) {
        return res.status(400).json({
            error: "Registration failed",
            details: err.message
        });
    }
};


const login = async (req, res) => {
    try {
        // 1. Correct object destructuring
        const { email, password } = req.body;

        // 2. Validate input fields
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // 3. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 4. Await password comparison
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 5. Generate JWT token
        const token = jwt.sign(
            { _id: user._id, email: user.email, role:user.role},
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );

        // 6. Set secure HTTP-only cookie
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // 7. Return success response
        return res.status(200).json({
            message: "User logged in successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                email: user.email
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: "Login failed",
            details: err.message
        });
    }
};


const logout = async (req, res) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(400).json({ error: "No active session or token found" });
        }

        // Decode token to find remaining validity time
        const payload = jwt.decode(token);

        if (payload && payload.exp) {
            // Calculate remaining seconds until token expires naturally
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            const remainingTime = payload.exp - currentTimeInSeconds;

            // Blocklist in Redis ONLY if token hasn't already expired
            if (remainingTime > 0) {
                // SET key with EX option sets TTL in seconds automatically
                await redisClient.set(`token:${token}`, 'Blocked', 'EX', remainingTime);
            }
        }

        // Clear the HTTP-Only cookie (Matching original cookie options)
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (err) {
        return res.status(500).json({
            error: "Logout failed",
            details: err.message
        });
    }
};

const adminRegister =async (req, res)=>{
    try {
        // 1. Check if body exists
        // if (!req.body || Object.keys(req.body).length === 0) {
        //     return res.status(400).json({ error: "Request body is missing or empty" });
        // }

        // // 2. Validate body schema
        // validate(req.body);


        const { firstName, email, password } = req.body;

        // 3. Guard against missing password field
        if (!password) {
            return res.status(400).json({ error: "Password field is required" });
        }

        // 4. Hash password safely
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            ...req.body,
            password: hashedPassword
        });

        const token = jwt.sign(
            { _id: user._id,email: user.email, role:user.role },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
        });

        return res.status(201).json({
            message: "User created successfully",
            user: { _id: user._id, firstName: user.firstName, email: user.email }
        });

    } catch (err) {
        return res.status(400).json({
            error: "Registration failed",
            details: err.message
        });
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register,login,logout, adminRegister, deleteProfile};