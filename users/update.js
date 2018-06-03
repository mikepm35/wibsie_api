'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // Data validation
  if (typeof data.password != 'string') {
    console.error('User update validation failed')
    callback(null, {
      statusCode: 400,
      headers: {'Content-Type': 'text/plain'},
      body: 'Failed updating user due to validation',
    });
    return;
  }

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeValues: {
      ':password': data.password,
      ':updated': timestamp,
    },
    UpdateExpression: 'SET password = :password, updated = :updated',
    ReturnValues: 'ALL_NEW'
  };

  // Update User in database
  dynamoDb.update(params, (error, result) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed updating user due to db write',
      });
      return;
    }

    // Create response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
    callback(null, response);
  });

};
