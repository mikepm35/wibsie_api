'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const locationHelper = require('./location_helper.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // Data validation
  if (typeof data.zip !== 'string') {
    console.error('Location create validation failed');
    callback(null, { //Don't set error object (null)
      statusCode: 400,
      headers: {'Content-Type': 'text/plain'},
      body: 'Failed creating Location due to validation',
    });
    return;
  }

  // Set table parameters
  var density_psqkm = null;
  const density_psqkm = (data.population/data.aland_sqm)*1000000;
  const params = {
    TableName: process.env.DYNAMODB_TABLE_LOCATIONS,
    Item: {
      zip: data.zip,
      created: timestamp,
      updated: timestamp,
      latitude: data.latitude,
      longitude: data.longitude,
      population: data.population,
      aland_sqm: data.aland_sqm,
      awater_sqm: data.awater_sqm,
      density_psqkm: density_psqkm,
      loc_type: locationHelper.getLocationType(density_psqkm),
    },
  };

  // Add Location to table
  dynamoDb.put(params, (error) => {
    // Handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 401,
        headers: {'Content-Type': 'text/plain'},
        body: 'Failed creating Location due to db write',
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
