'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const userHelper = require('./user_helper.js');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // TODO: Data validation

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Key: {
      id: event.pathParameters.userid,
    },
    ExpressionAttributeValues: {
      ':password': data.password,
      ':updated': timestamp,
      ':gender': data.gender,
      ':height_in': data.height_in,
      ':weight_lb': data.weight_lb,
      ':bmi': userHelper.getBMI(data.weight_lb, data.height_in),
      ':lifestyle': data.lifestyle,
    },
    UpdateExpression: 'SET password = :password, updated = :updated, gender = :gender, height_in = :height_in, weight_lb = :weight_lb, bmi = :bmi, lifestyle = :lifestyle',
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
