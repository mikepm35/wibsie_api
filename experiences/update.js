'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // TODO: Data validation

  // Set table parameters - use zip as key to determine if full update
  var params = {};
  if (data.zip) {
    params = {
      TableName: process.env.DYNAMODB_TABLE_EXPERIENCES,
      Key: {
        user_id: event.pathParameters.userid,
        created: parseInt(event.pathParameters.created)
      },
      ExpressionAttributeValues: {
        ':updated': timestamp,
        ':zip': data.zip,
        ':weather_expiration': data.weather_expiration,
        ':activity': data.activity,
        ':upper_clothing': data.upper_clothing,
        ':lower_clothing': data.lower_clothing,
        ':comfort_level_result': data.comfort_level_result,
        ':comfort_level_prediction': data.comfort_level_prediction,
      },
      UpdateExpression: 'SET updated = :updated, zip = :zip, weather_expiration = :weather_expiration, activity = :activity, upper_clothing = :upper_clothing, lower_clothing = :lower_clothing, comfort_level_result = :comfort_level_result, comfort_level_prediction = :comfort_level_prediction',
      ReturnValues: 'ALL_NEW'
    };
  } else if (data.comfort_level_result) {
    params = {
      TableName: process.env.DYNAMODB_TABLE_EXPERIENCES,
      Key: {
        user_id: event.pathParameters.userid,
        created: parseInt(event.pathParameters.created)
      },
      ExpressionAttributeValues: {
        ':updated': timestamp,
        ':comfort_level_result': data.comfort_level_result,
      },
      UpdateExpression: 'SET updated = :updated, comfort_level_result = :comfort_level_result',
      ReturnValues: 'ALL_NEW'
    };
  }

  // Update experience in database
  dynamoDb.update(params, (error, result) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed updating experience due to db write',
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
