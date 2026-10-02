const express = require('express');
const authRouter = express.Router();
const {register,login,logout, adminRegister, deleteProfile} = require('../controllers/userAuthent');
const adminMiddleware = require('../middlewares/adminMiddleware');
const userMiddleware = require('../middlewares/userMiddleware');

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware,logout);
authRouter.post('/admin/register', adminMiddleware,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply = {
        firstName: req.user.firstName,
        email: req.user.email,
        _id:req.user._id,
        role:req.user.role,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})

module.exports = authRouter;