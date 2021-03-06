'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = (event, context, callback) => {
  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
  };

  // Get all users
  dynamoDb.scan(params, (error, result) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed getting all users due to db fetch',
      });
      return;
    }

    // Create response
    for (var i = 0, len = result.Items.length; i < len; i++) {
      delete result.Items[i].password;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    callback(null, response);

  });

};
