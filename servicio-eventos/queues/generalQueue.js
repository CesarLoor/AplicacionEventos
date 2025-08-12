const { Queue } = require('bullmq');
require('dotenv').config();

const generalQueue = new Queue('eventos', {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

module.exports = generalQueue;
