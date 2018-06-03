'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.delete = (event, context, callback) => {
  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Key: {
      id: event.pathParameters.id,
    },
  };

  // Delete user
  dynamoDb.delete(params, (error) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed deleting user due to db delete',
      });
      return;
    }

    // Create response
    const response = {
      statusCode: 200,
      body: JSON.stringify({}),
    };
    callback(null, response);

  });

};
