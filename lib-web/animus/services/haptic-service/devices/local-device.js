/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Options,
  Logger,
  bone,
  Device
) {

  var Log = Logger.create("LocalDevice");

  var LocalDevice = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(LocalDevice.prototype, {
    initialize: function(opts) {
      opts = Options.fromObject(opts);

      this._pinMap = opts.getOrElseFn("pinMap", function() {
        var map = {};
        map[Device.Motor.TEST] = "P9_14";

        map[Device.Motor.LOF]  = "P9_14";
        map[Device.Motor.LIF]  = "P9_16";
        map[Device.Motor.LIB]  = "P8_13";
        map[Device.Motor.LOB]  = "P8_19";
        return map;
      })

    },
    init: Promise.method(function() {
      return Promise.each(_.values(this._pinMap), function(pin) {
        return new Promise(function(resolve, reject) {
          bone.pinMode(pin, bone.OUTPUT, undefined, undefined, undefined, function(resp) {
            if (resp && resp.err) return reject(resp.err);

            resolve();
          });
        })
      });
    }),

    on: Promise.method(function(motor) {
      return new Promise(_.bind(function(resolve, reject) {
        Log.debug("Writing ON for motor, pin", motor, this._pinMap[motor]);
        bone.analogWrite(this._pinMap[motor], 1.0, 2000.0, function(resp) {
          if (resp && resp.err) return reject(resp.err);

          resolve();
        });
      }, this));
    }),

    off: Promise.method(function(motor) {
      return new Promise(_.bind(function(resolve, reject) {
        Log.debug("Writing OFF for motor, pin", motor, this._pinMap[motor]);
        bone.analogWrite(this._pinMap[motor], 0.0, 2000.0, function(resp) {
          if (resp && resp.err) return reject(resp.err);

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
        })
        .delay(duration);
    })
  });

  return LocalDevice;
};

module.exports = mod(
  require("underscore"),
  require("bluebird"),
  require("thicket").c("options"),
  require("thicket").c("logger"),
  require("bonescript"),
  require("../../../concepts/device")
);
