'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Run a scan, return closest zip to fetch request
module.exports.zipFromLatLong = (event, context, callback) => {
  console.log('Received event: ', event)

  // Handle lambda-lambda calls
  var data = event.body
  if (typeof data == 'string') {
    data = JSON.parse(data)
  }

  console.log('Data: ', data)

  // TODO: Data validation

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_LOCATIONS,
  };

  // Get all locations
  dynamoDb.scan(params, (error, result) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed getting all locations due to db fetch',
      });
      return;
    }

    // Find minimum
    var minZipItem = {};
    var minDistance = 9999999;

    for (var item in result.Items) {
      item = result.Items[item];
      var distance = Math.sqrt(Math.pow((item.latitude-data.latitude),2) + Math.pow((item.longitude-data.longitude),2));

      if (distance < minDistance) {
        minZipItem = item;
        minDistance = distance;
      }
    }

    console.log('minZipItem after scan: ', minZipItem)

    // Create response
    const response = {
      statusCode: 200,
      body: JSON.stringify(minZipItem),
    };
    callback(null, response);

  });

};
