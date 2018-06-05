'use strict';

const mysql = require('mysql');
// const Redis = require('ioredis');

let localEnv = null;

try {
    localEnv = require('./local');
} catch (e) {

}

// Help function to generate an IAM policy
var generatePolicy = function(principalId, effect, resource) {
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect || resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    // Optional output with custom properties of the String, Number or Boolean type.
    // authResponse.context = {
    //     "stringKey": "stringval",
    //     "numberKey": 123,
    //     "booleanKey": true
    // };
    return authResponse;
};

var policyDecider = function (ourToken, receivedToken, e, callback) {
    if (ourToken == receivedToken) {
        const policy = generatePolicy('' + (new Date()).getTime(), 'Allow', e.methodArn);
        return callback(null, policy);
    } else {
        return callback('Unauthorized');
    }
};

module.exports.hello = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v1.0! Our Hula Serverless end point working good.',
            input: event,
        })
    };

    callback(null, response);

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
module.exports.auth = (event, context, callback) => {

    context.callbackWaitsForEmptyEventLoop = false;

    const db_host = process.env.IS_OFFLINE == 'true'  && !!localEnv ? localEnv.mysql.host : process.env.MYSQL_HOST;
    const db_user = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.mysql.user : process.env.MYSQL_USER;
    const db_password = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.mysql.password : process.env.MYSQL_PASSWORD;
    const db_database = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.mysql.database : process.env.MYSQL_DATABASE;

    // const redis_host = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.redis.host : process.env.REDIS_HOST;
    // const redis_user = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.redis.user : process.env.REDIS_USER;
    // const redis_pass = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.redis.passowrd : process.env.REDIS_PASSWORD;
    // const redis_port = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.redis.port : process.env.REDIS_PORT;
    // const redis_dbc = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.redis.db : process.env.REDIS_DBC;
    // const redis_stage = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.stage : process.env.STAGE;


    var sentAuth = '';
    if (event.hasOwnProperty('authorizationToken')) sentAuth = event.authorizationToken;
    if (sentAuth == '' && event.hasOwnProperty('headers')
        && event.headers.hasOwnProperty('Authorization'))
        sentAuth = event.headers.Authorization;

    const connection = mysql.createConnection({
        host: db_host,
        user: db_user,
        password: db_password,
        database: db_database
    });

    //const rclient = new Redis('redis://' + redis_user + ':' + redis_pass + '@' + redis_host + ':' + redis_port + '/' + redis_dbc);
    //const API_KEY = redis_stage + '.API_KEY';

    //rclient.get(API_KEY, function (err, key) {
    //    if (!key) {
            connection.connect();
            connection.query("SELECT * from l_api_token where Name = 'API_KEY';", function (error, query_result, fields) {
                if (error) {
                    const errorMesage = error.sqlMessage;
                    const response = {
                        statusCode: 500,
                        body: JSON.stringify({
                            errorMesage
                        })
                    };
                    callback(null, response);
                }

                const API_KEY_RECORD = query_result[0];
                //rclient.set(API_KEY, API_KEY_RECORD.token, 'EX', 21600);

                connection.end();
                //rclient.quit();
                return policyDecider(API_KEY_RECORD.token,sentAuth,event,callback);
            });
    //    } else {
    //        rclient.quit();
    //        return policyDecider(key, sentAuth, event, callback);
    //    }
    // });
};
module.exports.secure = (event,context,callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v1.0! This is secure api with authorization header.',
            input: event,
        }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods" : "*",
            "Access-Control-Allow-Headers": "Authorization"
        }
    };

    callback(null, response);
}
