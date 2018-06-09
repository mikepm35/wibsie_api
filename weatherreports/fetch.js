'use strict';

const request = require('request');

const weatherHelper = require('./weather_helper.js')

// When called through api gateway latlong is in pathParameters
module.exports.fetch = (event, context, callback) => {
  console.log('Received event: ', event);

  var latlong = event.pathParameters.latlong;

  console.log('Event latlong: ', latlong);

  // TODO: Data validation

  // Fetch weather report real-time
  //var url = 'https://api.weather.gov/points/' + latlong + '/forecast';
  var url = 'https://api.darksky.net/forecast/9bb52d7f1159142da5e1f182eb900d60/' + latlong;

  console.log('start request to ' + url);

  request.get({
      url: url,
      json: true,
      headers: {'User-Agent': 'wibsie'}
    }, (err, res, data) => {
      if (err || res.statusCode !== 200) {
        console.log('Status:', res.statusCode);
        console.log('Error:', err);
        callback(null, {
          statusCode: res.statusCode || 501,
          headers: {'Content-Type': 'text/plain'},
          body: 'Failed fetching data due to http get',
        });
        return;
      } else {
        // data is already parsed as JSON:
        console.log('Fetched data: ', data);

        // Construct full response
        var parsedData = weatherHelper.parseForecast(data.currently, 30, 'darksky');
        parsedData.raw = data;

        // Create response
        const response = {
          statusCode: 200,
          body: JSON.stringify(parsedData),
        };
        callback(null, response);

      }
  });

};
