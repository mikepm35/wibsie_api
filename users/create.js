'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const userHelper = require('./user_helper.js');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // TODO: Data validation
  // e.g. lifestyle = ['sedentary', 'moderate_activity', 'high_activity']

  // Check if email already exists
  const paramsScan = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
  };

  dynamoDb.scan(paramsScan, (error, result) => {
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

    var responseItem = null;
    for (var item in result.Items) {
      item = result.Items[item];

      if (item.id==='global') {
        continue;
      }

      if (item.email.toLowerCase()===data.email.toLowerCase()) {
        responseItem = item;
        break;
      }
    }

    if (responseItem) {
      console.error('Found duplicate user: ', responseItem);
      callback(null, {
        statusCode: 409,
        headers: {'Content-Type': 'text/plain'},
        body: 'User email already exists',
      });
      return;
    }

    // Create password hash
    var hash = bcrypt.hashSync(data.password, 10);

    // Set update parameters
    const paramsCreate = {
      TableName: process.env.DYNAMODB_TABLE_USERS,
      Item: {
        id: uuid.v1(),
        created: timestamp,
        updated: timestamp,
        email: data.email,
        password: hash,
        birth_year: data.birth_year,
        gender: data.gender,
        height_in: data.height_in,
        weight_lb: data.weight_lb,
        bmi: userHelper.getBMI(data.weight_lb, data.height_in),
        lifestyle: data.lifestyle,
      },
    };

    // Add user to table
    dynamoDb.put(paramsCreate, (error) => {
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
      delete paramsCreate.Item.password;
      const response = {
        statusCode: 200,
        body: JSON.stringify(paramsCreate.Item), //table fields
      };
      callback(null, response);

    }); // end of put

  }); // end of scan

};
