'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const userHelper = require('./user_helper.js');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // TODO: Data validation
  // e.g. lifestyle = ['sedentary', 'moderate_activity', 'high_activity']

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Item: {
      id: uuid.v1(),
      created: timestamp,
      updated: timestamp,
      email: data.email,
      password: data.password,
      gender: data.gender,
      height_in: data.height_in,
      weight_lb: data.weight_lb,
      bmi: userHelper.getBMI(data.weight_lb, data.height_in),
      lifestyle: data.lifestyle,
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
