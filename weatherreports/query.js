'use strict';

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Weather reports are stored by zip and within an epoch range (created->expires)
// Epoch query param can be "now"
// Location query parameters can be zip or lat,long
// Location is resolved to a zip and with time used to search for existing weather report
// If weather report doesn't exist, fetch it from service and store in database
module.exports.query = (event, context, callback) => {
  const timestamp = new Date().getTime();
  var epoch = event.queryStringParameters.epoch;

  var location = event.queryStringParameters.location;

  // Check if pulling "now" epoch
  if (epoch == 'now') {
    epoch = timestamp;
  }

  // Determine location resolution path
  if (location.indexOf(',') > -1) {
    console.log('Resolving latlong data: ', location);

    // Parse string assuming lat,long format
    var lat = location.split(',')[0];
    var long = location.split(',')[1];

    // Fetch zip for lat,long
    var locationInvokeParams = {
      FunctionName: process.env.FUNCTION_PREFIX + 'location_zipfromlatlong',
      InvocationType: 'RequestResponse', // 'Event | RequestResponse | DryRun'
      Payload: JSON.stringify({'body': {'latitude': lat, 'longitude': long}}, null)
    }
  } else {
    console.log('Assuming location data is zip: ', location)

    // Fetch zip entry
    var locationInvokeParams = {
      FunctionName: process.env.FUNCTION_PREFIX + 'location_get',
      InvocationType: 'RequestResponse', // 'Event | RequestResponse | DryRun'
      Payload: JSON.stringify({'pathParameters': {'zip': location}}, null)
    }
  }

  // Start location invoke and callback cascade
  lambda.invoke(locationInvokeParams, function(error, data) {
    if (error) {
      console.log('location_get lambda invoke  error: ', error, error.stack);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed fetching data due to location invoke parameters',
      });
      return;
    } else {
      console.log('location invoke result: ', data);
      var locationData = JSON.parse(JSON.parse(data.Payload).body);

      // Start query for weather report
      var getWeatherParams = {
          TableName : process.env.DYNAMODB_TABLE_WEATHERREPORTS,
          KeyConditionExpression: "#zip = :zipquery and #expires >= :epochquery",
          FilterExpression: "#created <= :epochquery",
          ExpressionAttributeNames: {
                "#zip":"zip",
                "#expires":"expires",
                "#created":"created"
            },
          ExpressionAttributeValues: {
              ":zipquery": locationData.zip,
              ":epochquery": epoch
          },
          ScanIndexForward: false,
          Limit: 1
      };

      var items = []
      dynamoDb.query(getWeatherParams, (error, result) => {
        console.log('Starting weather query with params: ', getWeatherParams)
        // Handle potential errors
        if (error) {
          console.error('getWeatherParams error: ', error);
          callback(null, {
            statusCode: error.statusCode || 501,
            headers: {'Content-Type': 'text/plain'},
            body: 'Failed fetching data due to db weather report query',
          });
          return;
        } else {
          console.log('Weather report query response: ', result);
          items = items.concat(result.Items);

          // Optionally fetch and store weather report
          if (items.length == 0) {
            // Get weather report and save
            console.log('No reports in items, fetching new');

            // Invoke lambda for fetch
            var weatherFetchInvokeParams = {
              FunctionName: process.env.FUNCTION_PREFIX + 'location_weatherreport_fetch',
              InvocationType: 'RequestResponse', // 'Event | RequestResponse | DryRun'
              Payload: JSON.stringify({'pathParameters': {'latlong': lat+','+long}}, null)
            }

            lambda.invoke(weatherFetchInvokeParams, function(error, data) {
              if (error) {
                console.log('location_weatherreport_fetch lambda invoke error: ', error, error.stack);
                callback(null, {
                  statusCode: error.statusCode || 501,
                  headers: {'Content-Type': 'text/plain'},
                  body: 'Failed fetching data due to weather fetch invoke parameters',
                });
                return;
              } else {
                // Parse weather report
                var weatherData = JSON.parse(JSON.parse(data.Payload).body);
                console.log('Received weatherData: ', weatherData)
                weatherData.zip = locationData.zip;

                // Save to db but don't wait on it
                var weatherCreateInvokeParams = {
                  FunctionName: process.env.FUNCTION_PREFIX + 'location_weatherreport_create',
                  InvocationType: 'Event', // 'Event | RequestResponse | DryRun'
                  Payload: JSON.stringify({'body': weatherData}, null)
                }

                lambda.invoke(weatherCreateInvokeParams, function(error, data) {
                  if (error) {
                    console.log('Error saving weather report');
                  } else {
                    console.log('Successfully saved weather report');
                  }
                });

                // Return weather data without waiting on db create
                const response = {
                  statusCode: 200,
                  body: JSON.stringify(weatherData), //table fields
                };
                callback(null, response);

              }
            });

          } else {
            // Use saved weather report
            console.log('Found weather report');

            // Return saved weather report
            const response = {
              statusCode: 200,
              body: JSON.stringify(items[0]),
            };
            callback(null, response);
          }
        }
      });
    }
  }); // end of outer lambda invoke

}; // end of function
