/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Lang,
  App,
  Runtime,
  Exchange,
  Logger,
  HapticService,
  HapticClient,
  SimulatedDevice,
  LocalDevice,
  Device
) {

  var Log = Logger.create("TestPulse");

  var TestPulse = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(TestPulse.prototype, App.prototype, {
    initialize: function() {
      App.prototype.initialize.apply(this, arguments);

      this._runtime = new Runtime();

      this._exchange = new Exchange({
        runtime: this._runtime
      });

      if (this.config("simulated")) {
        Log.debug("Using simulated device");
        this._device = new SimulatedDevice();
      } else {
        Log.debug("Using physical device");
        this._device = new LocalDevice();
      }

      this._service = new HapticService({
        exchange: this._exchange,
        device:   this._device
      });

      this._client = new HapticClient({
        exchange:        this._exchange,
        serviceIdentity: this._service.instanceId()
      });
    },

    up: Promise.method(function() {
      var t = this.config("test");
      t = "_test" + t.charAt(0).toUpperCase() + t.substr(1);
      return this[t]();
    }),

    down: Promise.method(function() {

    }),

    _testPulse: Promise.method(function() {
      return this._service
        .start()
        .bind(this)
        .then(function() {
          return this._client.initSession();
        })
        .then(function(sessionId) {
          return this._client.testDevice({
            sessionId:     sessionId,
            pulses:        this.config("pulses"),
            pulseDuration: this.config("pulseDuration")
          });
        });
    }),

    _testPulseIntArray: Promise.method(function() {
      return this._service
        .start()
        .bind(this)
        .then(function() {
          return this._client.initSession();
        })
        .then(function(sessionId) {
          return this._client.pulseIntArray({
            sessionId:     sessionId,
            intArray:      this.config("intArray"),
            pulseDuration: this.config("pulseDuration"),
            restDuration:  this.config("restDuration")
          })
        });
    }),

    _testActiveInput: Promise.method(function() {
      var deferred = Lang.deferred();

      return this._service
        .start()
        .bind(this)
        .then(function() {
          return this._client.initSession();
        })
        .then(function(sessionId) {
          process.stdin.setRawMode(true);
          process.stdin.resume();
          process.stdin.on('data', _.bind(function(data) {
            process.stdout.write('Get Chunk: ' + data + '\n');
            var s = "" + data;

            if (s === "c" || s === "z") deferred.resolve();

            var motors = null;

            switch(s) {
              case "1":
                motors = [Device.Motor.LIF];
                break;
              case "2":
                motors = [Device.Motor.LOF];
                break;
              case "q":
                motors = [Device.Motor.LIF | Device.Motor.LOF];
            }

            if (motors) {
              this._client.pulseIntArray({
                sessionId: sessionId,
                intArray: motors,
                pulseDuration: this.config("pulseDuration"),
                restDuration: this.config("restDuration")
              })
            }


          }, this));
        })
        .then(function() {
          return deferred.promise;
        });

    })
  });

  return TestPulse;
};

var thicket = require("thicket"),
    animus = require("../../../lib-node/animus");

var TestPulse = mod(
  require("underscore"),
  require("bluebird"),
  thicket.c("lang"),
  thicket.c("app"),
  thicket.c("runtime"),
  thicket.c("messaging/exchange"),
  thicket.c("logger"),
  animus.c("haptic-service"),
  animus.c("haptic-client"),
  animus.c("devices/simulated"),
  animus.c("devices/local"),
  animus.c("device")
);


var Bootstrapper = thicket.c("bootstrapper"),
    Logger = thicket.c("logger"),
    CLA = thicket.c("appenders/console-log");

Logger.root().setLogLevel("Debug");
Logger.root().addAppender(new CLA());

var b = new Bootstrapper({
  applicationConstructor: TestPulse
});

b
  .bootstrap()
  .then(function(app) {
    return app.start().then(function() {
      return app.stop();
    })
  });
