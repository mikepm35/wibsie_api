'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

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
  var params = {
    TableName: process.env.DYNAMODB_TABLE_LOCATIONS,
  };

  // Apply any parameter overrides
  if (data.tableName) {
    params.TableName = data.tableName;
  }

  // Run scan
  var minZipItem = {};
  var minDistance = 9999999;
  dynamoDb.scan(params, onScan);

  // Function for recursive scanning
  function onScan(error, result) {
    console.log('Starting onScan round');
    if (error) {
      console.error('Scan error: ', error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed getting all locations due to db fetch',
      });
      return;
    } else {
      for (var item in result.Items) {
        item = result.Items[item];
        var distance = Math.sqrt(Math.pow((item.latitude-data.latitude),2) + Math.pow((item.longitude-data.longitude),2));

        if (distance < minDistance) {
          minZipItem = item;
          minDistance = distance;
        }
      }
      console.log('Post-scan round minZipItem, minDistance: ', minZipItem, minDistance);

      // continue scanning if we have more movies, because
      // scan can retrieve a maximum of 1MB of data
      if (typeof result.LastEvaluatedKey != "undefined") {
          console.log('Scanning for more...');
          params.ExclusiveStartKey = result.LastEvaluatedKey;
          dynamoDb.scan(params, onScan);
      } else {
        console.log('Final minZipItem, minDistance: ', minZipItem, minDistance);
        // Create response
        const response = {
          statusCode: 200,
          body: JSON.stringify(minZipItem),
        };
        callback(null, response);
      }

    }
  }

};
