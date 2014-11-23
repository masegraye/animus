/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Channel,
  Logger,
  Device
) {

  var Log = Logger.create("SimulatedDevice");

  var SimulatedDevice = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(SimulatedDevice.prototype, {
    initialize: function() {
      // Errors come out here
      this._statusChannel = new Channel({ sentinel: this });
    },

    statusChannel: function() {
      return this._statusChannel;
    },

    init: Promise.method(function() {
      return;
    }),

    testPulse: Promise.method(function(duration) {
      return this
        .on(Device.Motor.TEST)
        .bind(this)
        .delay(duration)
        .then(function() {
          this.off(Device.Motor.TEST)
        })
        .delay(duration);
    }),


    on: Promise.method(function(motor) {
      return;
    }),


    off: Promise.method(function(motor) {
      return;
    })
  });

  return SimulatedDevice;
};

module.exports = mod(
  require("underscore"),
  require("bluebird"),
  require("thicket").c("channel"),
  require("thicket").c("logger"),
  require("./device")
);
