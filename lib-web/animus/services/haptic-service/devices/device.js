/*global require: false, module: false */
"use strict";

var mod = function(
  _
) {

  var Device = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(Device.prototype, {
    initialize: function() {}
  });

  _.extend(Device, {
    Motor: {
      TEST: 0
    }
  })

  return Device;
};

module.exports = mod(
  require("underscore")
);
