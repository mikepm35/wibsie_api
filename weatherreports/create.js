'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();

  // Handle lambda-lambda calls
  var data = event.body
  if (typeof data == 'string') {
    data = JSON.parse(data)
  }

  // Data validation
  if (typeof data.zip !== 'string') {
    console.error('Weather report create validation failed');
    callback(null, { //Don't set error object (null)
      statusCode: 400,
      headers: {'Content-Type': 'text/plain'},
      body: 'Failed creating weather report due to validation',
    });
    return;
  }

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_WEATHERREPORTS,
    Item: data,
  };

  // Add Location to table
  dynamoDb.put(params, (error) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 401,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed creating weather report due to db write',
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
