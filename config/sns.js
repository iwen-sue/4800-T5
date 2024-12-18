const AWS = require('aws-sdk');

const sns = new AWS.SNS({
    region: 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

module.exports = sns;