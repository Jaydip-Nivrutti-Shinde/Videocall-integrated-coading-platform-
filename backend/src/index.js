const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/userAuth');
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemCreator.js')
const submitRouter = require('./routes/submit.js');
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173', //here if wrote * then anyone can access it if mentioned link then for that only
    credentials: true 
}));

app.use(express.json());
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));

app.use('/user', authRouter);
app.use('/problems', problemRouter);
app.use('/submission', submitRouter);


const InitalizeConnection = async ()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        
        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error in index.js: "+err);
    }
}


InitalizeConnection();