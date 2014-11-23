/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Options,
  UUID,
  Courier,
  Logger
) {

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
      return this._courier
        .sendAndReceive(this._serviceIdentity, {
          mT: "testDevice",
          sessionId:     opts.getOrError("sessionId"),
          pulses:        opts.getOrError("pulses"),
          pulseDuration: opts.getOrElse("pulseDuration", 250)
        })
        .then(function() {
          Log.debug("Test complete");
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
  require("thicket").c("logger")
);
