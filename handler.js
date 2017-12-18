'use strict';

const mysql = require('mysql');

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
}

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

    var db_host = process.env.IS_OFFLINE == 'true'  && !!localEnv ? localEnv.mysql.host : process.env.MYSQL_HOST;
    var db_user = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.mysql.user : process.env.MYSQL_USER;
    var db_password = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.mysql.password : process.env.MYSQL_PASSWORD;
    var db_database = process.env.IS_OFFLINE == 'true' && !!localEnv ? localEnv.mysql.database : process.env.MYSQL_DATABASE;

    const connection = mysql.createConnection({
        host: db_host,
        user: db_user,
        password: db_password,
        database: db_database
    });

    connection.connect();

    connection.query("SELECT * from l_api_token where Name = 'API_KEY';", function(error, results, fields) {
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
        const API_KEY_RECORD = results[0];

        var sentAuth = '';
        if(event.hasOwnProperty('authorizationToken')) sentAuth = event.authorizationToken;
        if(sentAuth == '' && event.hasOwnProperty('headers') && event.headers.hasOwnProperty('Authorization'))
            sentAuth = event.headers.Authorization;

        if (API_KEY_RECORD.token == sentAuth) {
            const policy = generatePolicy('' + (new Date()).getTime(), 'Allow', event.methodArn);
            return callback(null , policy );
        } else {
            return callback('Unauthorized');
        }
    });
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
