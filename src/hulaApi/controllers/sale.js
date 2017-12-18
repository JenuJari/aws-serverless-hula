'use strict';

let localEnv = null;

try {
    localEnv = require('./../../../local');
} catch (e) {

}

const AWS = require('aws-sdk');

exports.PublishClaimedEvent = function (event, context, callback) {

    AWS.config.region = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.aws.IOT_AWS_REGION : process.env.IOT_AWS_REGION;
    const iotData = new AWS.IotData({
        endpoint: process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.aws.IOT_ENDPOINT_HOST : process.env.IOT_ENDPOINT_HOST
    });

    const body = JSON.parse(event.body);

    if (!body.hasOwnProperty('conid') || !body.hasOwnProperty('userId') || !body.hasOwnProperty('email') || !body.hasOwnProperty('userType')) {
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
        let message = {
            event: "newClaimForProduct",
            userId: body.userId,
            email: body.email,
            userType: body.userType
        };
        let params = {
            topic: 'claim-chanel-consultant-' + body.conid,
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
