'use-strict';

module.exports = {
  getBMI: function (weight_lb, height_in) {
    return (weight_lb/height_in/height_in*703);
  },

}
