'use-strict';

module.exports = {
  getLocationType: function (pop_density) {
    //pop_density provided in people per sq kilometer
    if (pop_density >= (12000/2.5899)) { //12000 p/sqmi
      return 'ultra_urban';
    } else if (pop_density >= (7500/2.5899)) { //7500 p/sqmi
      return 'urban';
    } else if (pop_density >= (1000/2.5899)) { //1000 p/sqmi
      return 'suburban';
    } else {
      return 'rural';
    }
  }
}
