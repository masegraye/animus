/*global require: false, module: false */
"use strict";

var mod = function(
  _
) {

  var b = function(bString) {
    return 0xFF & parseInt(bString.replace("_", ""), 2);
  };

  var Device = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(Device.prototype, {
    initialize: function() {}
  });

  _.extend(Device, {
    Motor: {
      TEST: b("0000_0001"), // 02h

      LOF : b("0000_0001"), // 01h, Left Outside Forward
      LIF : b("0000_0010"), // 02h, Left Inside  Forward
      LOB : b("0000_0100"), // 04h, Left Outside Back
      LIB : b("0000_1000"), // 08h, Left Inside  Back
      LTF : b("0001_0000"), // 10h, Left Top     Forward
      LTB : b("0010_0000")  // 20h, Left Top     Back
    }
  })

  return Device;
};

module.exports = mod(
  require("underscore")
);
