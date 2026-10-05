// const { createClient } = require('redis') ;

// const redisClient = createClient({
//     username: 'default',
//     password: process.env.REDIS_PASS,
//     socket: {
//         host: 'redis-11862.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
//         port: 11862
//     }
// });

// module.exports = redisClient;



const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-11862.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 11862,
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.log('[Redis] Too many reconnects, giving up');
                return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000, // 10 seconds
    },
});

// IMPORTANT: handle errors so it doesn't crash the whole server
redisClient.on('error', (err) => {
    console.log('[Redis] Error (ignored):', err.message);
});

redisClient.on('connect', () => {
    console.log('[Redis] Connected');
});

redisClient.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
});

module.exports = redisClient;