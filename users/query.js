'use strict';

const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.query = (event, context, callback) => {
  // Get request body (expecting post)
  var data = JSON.parse(event.body);
  var email = data.email;
  var password = data.password;

  console.log('User query for email: ', data, email);

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
  };

  // Get all users
  dynamoDb.scan(params, (error, result) => {
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

    var responseCode = 404;
    var responseItem = {};
    for (var item in result.Items) {
      item = result.Items[item];

      if (item.id==='global') {
        continue;
      }

      // if (item.email.toLowerCase()===email.toLowerCase() && item.password===password) {
      //   responseCode = 200;
      //   responseItem = item;
      //   break;
      // }

      if (item.email.toLowerCase() === email.toLowerCase()) {
        if (process.env.STAGE === 'dev' && item.password.indexOf('$') < 0) {
          console.log('Using plain text password match: ', email);
          var pwmatch = item.password===password;
        } else {
          var pwmatch = bcrypt.compareSync(password, item.password);
        }

        if (pwmatch) {
          responseCode = 200;
          responseItem = item;
          break;
        } else {
          console.log('Emails match but passwords dont for: ', email);
        }
      }

    }

    console.log('User query result: ', responseCode, responseItem);

    // Create response
    delete responseItem.password;
    const response = {
      statusCode: responseCode,
      body: JSON.stringify(responseItem),
    };
    callback(null, response);

  });

};
