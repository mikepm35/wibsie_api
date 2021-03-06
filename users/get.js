'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (event, context, callback) => {
  console.log('userid: ', event.pathParameters.userid);

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Key: {
      id: event.pathParameters.userid,
    },
  };

  // Get data from table
  dynamoDb.get(params, (error, result) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed fetching data due to db read',
      });
      return;
    }

    // Create response
    delete result.Item.password;
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
    callback(null, response);

  });

};
