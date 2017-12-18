'use strict';

let localEnv = null;

try {
    localEnv = require('./../../local');
} catch (e) {

}

const AWS = require('aws-sdk');

AWS.config.region = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.aws.IOT_AWS_REGION : process.env.IOT_AWS_REGION;
const iotData = new AWS.IotData({
    endpoint: process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.aws.IOT_ENDPOINT_HOST : process.env.IOT_ENDPOINT_HOST
});

exports.handler = (message) => {
    let params = {
        topic: 'client-disconnected',
        payload: JSON.stringify(message),
        qos: 0
    };

    iotData.publish(params, function(err, data){
        if(err){
            console.log('Unable to notify IoT of stories update: ${err}');
        }
        else{
            console.log('Successfully notified IoT of stories update');
        }
    });
};

exports.genericEndPoint = (event, context, callback) => {

    const body = JSON.parse(event.body);

    if (!body.hasOwnProperty('topic') || !body.hasOwnProperty('event') || !body.hasOwnProperty('userId') || !body.hasOwnProperty('email') || !body.hasOwnProperty('userType')) {
        const response = {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing post parameter.',
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "Authorization"
            }
        };

        callback(null, response);
        return;

    } else {
        let message = {};

        message = Object.assign(message,body);
        message.event = body.event;
        message.userId = body.userId;
        message.email = body.email;
        message.userType = body.userType;
        delete message.topic;        

        let params = {
            topic: body.topic,
            payload: JSON.stringify(message),
            qos: 0
        };

        iotData.publish(params, function (err, data) {
            if (err) {
                console.log('Unable to notify IoT of stories update: ${err}');
            }
        });

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Message published'
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "Authorization"
            }
        };

        callback(null, response);
    }

};
