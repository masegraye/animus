/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Options,
  UUID,
  Courier,
  Logger,
  Device
) {

  var DEFAULT_PULSE_DURATION = 100,
      DEFAULT_REST_DURATION  = 100,
      REPLY_TIMEOUT_SLACK    = 3000;

  var Log = Logger.create("HapticClient");

  var HapticClient = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(HapticClient.prototype, {
    initialize: function(opts) {
      opts = Options.fromObject(opts);

      this._exchange = opts.getOrError("exchange");
      this._serviceIdentity = opts.getOrError("serviceIdentity");

      this._clientId = opts.getOrElseFn("clientId", function() {
        return UUID.v4();
      });

      this._mailbox = this._exchange.mailbox(this._clientId);

      this._courier = new Courier({
        mailbox: this._mailbox,
        delegate: this
      });

    },

    initSession: Promise.method(function() {
      return this._courier
        .sendAndReceive(this._serviceIdentity, {
          mT: "initSession"
        })
        .then(function(resp) {
          Log.debug("Received session", resp.sessionId);
          return resp.sessionId;
        });
    }),

    testDevice: Promise.method(function(opts) {
      opts = Options.fromObject(opts);
      var pulses = opts.getOrError("pulses"),
          pulseDuration = opts.getOrElse("pulseDuration", DEFAULT_PULSE_DURATION),
          restDuration = opts.getOrElse("restDuration", DEFAULT_REST_DURATION),
          replyTimeout = pulses * pulseDuration + REPLY_TIMEOUT_SLACK; // A little squeeze room!


      return this._courier
        .sendAndReceive(this._serviceIdentity, {
          mT: "testDevice",
          sessionId:     opts.getOrError("sessionId"),
          pulses:        pulses,
          pulseDuration: pulseDuration,
          restDuration: restDuration
        }, { replyTimeout: replyTimeout })
        .then(function() {
          Log.debug("Test complete");
        });
    }),

    pulseIntArray: Promise.method(function(opts) {
      opts = Options.fromObject(opts);

      var sessionId =     opts.getOrError("sessionId"),
          ints =          opts.getOrError("intArray"),
          pulseDuration = opts.getOrElse("pulseDuration", DEFAULT_PULSE_DURATION),
          restDuration =  opts.getOrElse("restDuration", DEFAULT_REST_DURATION),
          replyTimeout =  ints.length * (pulseDuration + restDuration) + REPLY_TIMEOUT_SLACK;

      var msg = {
        mT:            "pulseIntArray",
        sessionId:     sessionId,
        intArray:      ints,
        pulseDuration: pulseDuration,
        restDuration:  restDuration
      };

      Log.debug("Sending pulseIntArray", msg, "with timeout", replyTimeout);

      return this._courier
        .sendAndReceive(this._serviceIdentity, msg, {
          replyTimeout: replyTimeout
        })
        .then(function() {
          Log.debug("pulseIntArray complete");
        });

    })
  });

  return HapticClient;
};

module.exports = mod(
  require("underscore"),
  require("bluebird"),
  require("thicket").c("options"),
  require("thicket").c("uuid"),
  require("thicket").c("messaging/courier"),
  require("thicket").c("logger"),
  require("../concepts/device")
);
