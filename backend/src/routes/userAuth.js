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


module.exports = authRouter;