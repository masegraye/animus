/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Options,
  bone,
  Device
) {

  var LocalDevice = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(LocalDevice.prototype, {
    initialize: function(opts) {
      opts = Options.fromObject(opts);

      this._pinMap = opts.getOrElseFn("pinMap", function() {
        var map = {};
        map[Device.Motor.TEST] = "P9_14";
        return map;
      })

    },
    init: Promise.method(function() {
      _.each(this._pinMap, function(pin, alias) {
        bone.pinMode(pin, bone.OUTPUT);
      });
    }),

    on: Promise.method(function(motor) {
      return new Promise(_.bind(function(resolve, reject) {
        bone.analogWrite(this._pinMap[motor], 1.0, 2000.0, function(err) {
          if (err) return reject(err);

          resolve();
        });
      }, this));
    }),

    off: Promise.method(function(motor) {
      return new Promise(_.bind(function(resolve, reject) {
        bone.analogWrite(this._pinMap[motor], 0.0, 2000.0, function(err) {
          if (err) return reject(err);

          resolve();
        });
      }, this));
    }),

    testPulse: Promise.method(function(duration) {
      return this
        .on(Device.Motor.TEST)
        .bind(this)
        .delay(duration)
        .then(function() {
          this.off(Device.Motor.TEST)
        });
    })
  });

  return LocalDevice;
};

module.exports = mod(
  require("underscore"),
  require("bluebird"),
  require("thicket").c("options"),
  require("bonescript"),
  require("./device")
);
