'use strict';

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (event, context, callback) => {
  const timestamp = new Date().getTime();
  var zipHolder = event.pathParameters.zip;
  var createdHolder = event.pathParameters.created;

  // Check if converting lat/long to zip
  if (zipHolder.indexOf(',') > -1) {
    // Parse string assuming lat,long format
    var lat = zipHolder.split(',')[0];
    var long = zipHolder.split(',')[1];

    // Fetch zip for lat,long
    var invokeParams = {
      FunctionName: process.env.FUNCTION_PREFIX + 'location_zipfromlatlong',
      InvocationType: 'RequestResponse', // 'Event | RequestResponse | DryRun'
      Payload: JSON.stringify({'body': {'latitude': lat, 'longitude': long}}, null)
    }

    lambda.invoke(invokeParams, function(error, data) {
      if (error) {
        console.log('lambda invoke  error: ', error, error.stack);
      } else {
        var locationData = JSON.parse(data)
        console.log('Lambda invoke data: ', locationData);
        zipHolder = locationData.zip
      }
    });

  } else {
    console.log('Zip parameter is not latlong: ', zipHolder)
  }

  console.log('Final zipHolder: ', zipHolder)

  // Check if pulling new
  if (createdHolder == 'now') {
    // Fetch new report, add to db, and return created string
    createdHolder = newWeatherReport(zip);
  }

  // Set table parameters
  const params = {
    TableName: process.env.DYNAMODB_TABLE_WEATHERREPORTS,
    Key: {
      zip: event.pathParameters.zip,
      created: event.pathParameters.created,
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
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
    callback(null, response);

  });

};

// function newWeatherReport(zip) {
//
// }
