'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // Data validation
  if (typeof data.email !== 'string') {
    console.error('User create validation failed');
    callback(null, { //Don't set error object (null)
      statusCode: 400,
      headers: {'Content-Type': 'text/plain'},
      body: 'Failed creating user due to validation',
    });
    return;
  }

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Item: {
      id: uuid.v1(),
      created: timestamp,
      updated: timestamp,
      email: data.email,
      password: data.password
    },
  };

  // Add user to table
  dynamoDb.put(params, (error) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 401,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed creating user due to db write',
      });
      return;
    }

    // If no error, generate response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item), //table fields
    };
    callback(null, response);
    
  });

};
