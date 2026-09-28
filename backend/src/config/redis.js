const { createClient } = require('redis') ;

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-11862.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 11862
    }
});

module.exports = redisClient;



