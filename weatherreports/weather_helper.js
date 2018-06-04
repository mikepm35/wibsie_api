'use-strict';

module.exports = {
  parseForecast: function (forecast, expMins, source) {
    // Construct data response
    data = {created: null,
            expires: null,
            summary: null,
            precipIntensity: null,
            precipProbability: null,
            precipType: null,
            temperature: null,
            apparentTemperature: null,
            dewPoint: null,
            humidity: null,
            pressure: null,
            windSpeed: null,
            windGust: null,
            windBearing: null,
            cloudCover: null,
            uvIndex: null,
            visibility: null}

    // Set expiration increment in ms
    var expInc = expMins * 60 * 1000;

    if (source == 'darksky') {
      data.created = forecast.time * 1000;
      data.expires = forecast.time * 1000 + expInc;
      data.summary = forecast.summary;
      data.precipIntensity = forecast.precipIntensity;
      data.precipProbability = forecast.precipProbability;
      data.precipType = forecast.precipType;
      data.temperature = forecast.temperature;
      data.apparentTemperature = forecast.apparentTemperature;
      data.dewPoint = forecast.dewPoint;
      data.humidity = forecast.humidity;
      data.pressure = forecast.pressure;
      data.windSpeed = forecast.windSpeed;
      data.windGust = forecast.windGust;
      data.windBearing = forecast.windBearing;
      data.cloudCover = forecast.cloudCover;
      data.uvIndex = forecast.uvIndex;
      data.visibility = forecast.visibility;
    }

    return data;

  }
}
