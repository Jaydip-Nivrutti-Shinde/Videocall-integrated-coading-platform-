const express = require('express');
const http = require('http');
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/userAuth');
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemCreator.js');
const submitRouter = require('./routes/submit.js');
const cors = require('cors');
const aiRouter = require('./routes/aiChatting.js');
const videoRouter = require('./routes/videoCreator.js');
const { connectVideoCallSocket } = require('./controllers/videoCallSocket.js');

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);

// health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const InitalizeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("DB Connected");

        // attach video-call socket AFTER DB is up
        connectVideoCallSocket(server);

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log("Server listening at port number: " + PORT);
        });
    }
    catch (err) {
        console.log("Error in index.js: " + err);
    }
};

InitalizeConnection();