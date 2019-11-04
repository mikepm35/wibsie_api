'use strict';

const AWS = require('aws-sdk');
const request = require('request');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

module.exports.location_append = (event, context, callback) => {
  const timestamp = new Date().getTime();

  event.Records.forEach((record) => {
    console.log(record.eventID)
    console.log(record.eventName)
    console.log('DynamoDB Record: %j', record.dynamodb)

    if (record.eventName === 'INSERT') {
      // Invoke location lambda to read item
      // If doesn't have additional data, make web call and append

      var locationInvokeParams = {
        FunctionName: process.env.FUNCTION_PREFIX + 'location_get',
        InvocationType: 'RequestResponse', // 'Event | RequestResponse | DryRun'
        Payload: JSON.stringify({'pathParameters': {'zip': record.dynamodb.NewImage.zip.S}}, null)
      }

      // Start location invoke
      lambda.invoke(locationInvokeParams, function(error,data) {
        console.log('locationInvokeParams get: ', locationInvokeParams);
        if (error) {
          console.log('location get lambda invoke  error: ', error, error.stack);
          callback(null, 'Failed fetching data due to location invoke parameters');
          return;
        } else {
          console.log('location invoke result: ', data);
          var locationData = JSON.parse(JSON.parse(data.Payload).body);

          if (locationData.population != null) {
            console.log('Location already has secondary data');
            callback(null, 'Location already has secondary data, no action');
            return;

          } else {
            // Begin fetch for secondary data
            var url = 'https://api.censusreporter.org/1.0/geo/tiger2018/86000US'+locationData.zip;
            console.log('start request to ' + url);

            request.get({
                url: url,
                json: true,
                headers: {'User-Agent': 'wibsie'}
              }, (err, res, data) => {
                if (err || res.statusCode !== 200) {
                  console.log('Status:', res.statusCode);
                  console.log('Error:', err);
                  callback(null, 'Failed fetching data due to http get');
                  return;
                } else {
                  // data is already parsed as JSON:
                  console.log('Fetched data: ', data);

                  // append location data
                  locationData.population = data.properties.population;
                  locationData.aland_sqm = data.properties.aland;
                  locationData.awater_sqm = data.properties.awater;

                  // invoke location lambda to update data
                  var locationInvokeParams = {
                    FunctionName: process.env.FUNCTION_PREFIX + 'location_update',
                    InvocationType: 'Event', // 'Event | RequestResponse | DryRun'
                    Payload: JSON.stringify({'body': locationData, 'pathParameters': {'zip': locationData.zip}}, null)
                  }

                  lambda.invoke(locationInvokeParams, function(error, data) {
                    console.log('locationInvokeParams update: ', locationInvokeParams);
                    if (error) {
                      console.log('location_update lambda invoke  error: ', error, error.stack);
                      callback(null, 'Failed updating data due to location invoke parameters');
                      return;
                    } else {
                      console.log('location_update lambda invoke successful');
                      callback(null, 'Successfully updated location data');
                      return;
                    }

                  }); // end lambda invoke to update location

                } // end web request parse

              }); // end web request

          } // end secondary property check

        } // end location get error check

      }); // end location invoke

    } else if (record.eventName === 'MODIFY') {
      if (record.dynamodb.NewImage.comfort_level_result.S != 'none') {
        console.log('Detected comfort_level_result result change, dispatching to upload_data');

        var uploaddataInvokeParams = {
          FunctionName: process.env.FUNCTION_PREFIX_ML + 'upload_data',
          InvocationType: 'Event', // 'Event | RequestResponse | DryRun'
          Payload: JSON.stringify({'user_id': record.dynamodb.Keys.user_id.S})
        }

        // Invoke
        lambda.invoke(uploaddataInvokeParams, function(error, data) {
          console.log('uploaddataInvokeParams update: ', uploaddataInvokeParams);
          if (error) {
            console.log('upload_data lambda invoke  error: ', error, error.stack);
            callback(null, 'Failed triggering upload_data due to location invoke parameters');
            return;
          } else {
            console.log('upload_data lambda invoke successful');
            callback(null, 'Successfully triggered upload_data');
            return;
          }
        }); // end lambda invoke to upload data

      } else {
        console.log('Modify event did not qualify');
      } // end if comfort_level_result

    }// end if INSERT/MODIFY

  }) // end event parse loop

};
