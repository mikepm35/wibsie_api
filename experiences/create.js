'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // TODO: Data validation

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_EXPERIENCES,
    Item: {
      created: timestamp,
      updated: timestamp,
      user_id: event.pathParameters.userid,
      zip: data.zip,
      weather_expiration: data.weather_expiration,
      activity: data.activity,
      upper_clothing: data.upper_clothing,
      lower_clothing: data.lower_clothing,
      comfort_level_result: data.comfort_level_result,
      comfort_level_prediction: data.comfort_level_prediction,
    },
  };

  // Add experience to table
  dynamoDb.put(params, (error) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 401,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed creating experience due to db write',
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
