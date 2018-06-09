'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const locationHelper = require('./location_helper.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();

  // Handle lambda-lambda calls
  var data = event.body
  if (typeof data == 'string') {
    data = JSON.parse(data)
  }

  // TODO: Data validation

  // Set table parameters
  const density_psqkm = locationHelper.getPopDensity(data.population, data.aland_sqm);
  const params = {
    TableName: process.env.DYNAMODB_TABLE_LOCATIONS,
    Key: {
      zip: event.pathParameters.zip,
    },
    ExpressionAttributeValues: {
      ':longitude': data.longitude,
      ':latitude': data.latitude,
      ':population': data.population,
      ':aland_sqm': data.aland_sqm,
      ':awater_sqm': data.awater_sqm,
      ':density_psqkm': density_psqkm,
      ':loc_type': locationHelper.getLocationType(density_psqkm),
      ':updated': timestamp,
    },
    UpdateExpression: 'SET longitude = :longitude, latitude = :latitude, population = :population, aland_sqm = :aland_sqm, awater_sqm = :awater_sqm, density_psqkm = :density_psqkm, loc_type = :loc_type, updated = :updated',
    ReturnValues: 'ALL_NEW'
  };

  // Update location in database
  dynamoDb.update(params, (error, result) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed updating location due to db write',
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
