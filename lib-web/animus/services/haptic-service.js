/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  Lang,
  Options,
  Courier,
  Logger,
  UUID,
  Device
) {

  var Log = Logger.create("HapticService");

  var DEFAULT_PULSE_DURATION = 100,
      DEFAULT_REST_DURATION = 100;

  var HapticService = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(HapticService.prototype, {
    initialize: function(opts) {
      opts = Options.fromObject(opts);


      this._instanceId = opts.getOrElseFn("instanceId", function() {
        return UUID.v4();
      });

      var exchange = opts.getOrError("exchange");

      this._mailbox = exchange.mailbox(this._instanceId);

      this._courier = new Courier({
        delegate: this,
        mailbox: this._mailbox,
        contextDelegate: function(msg, envelope) {
          return {
            sessionRequired: !msg.mT || msg.mT !== "initSession",
            sessionId: msg.sessionId
          };
        }
      });

      this._session = null;

      this._device = opts.getOrError("device");

      // Not elegant, but it works...
      var verifyContext = _.bind(this._verifyContext, this);
      _.each(HapticService.prototype, function(method, name) {
        if (name.indexOf("onReq") === 0 || name.indexOf("onMsg") === 0) {
          this[name] = Promise.method(function(_msg, ctx) {
            var args = arguments;
            return verifyContext(ctx)
              .bind(this)
              .then(function() {
                return method.apply(this, args);
              });
          });
        }
      }, this);
    },

    instanceId: function() {
      return this._instanceId;
    },

    start: Promise.method(function(){
      // TODO: Connect to device
      return this._device.init();
    }),

    stop: Promise.method(function() {
      // TODO: Disconnect from device

    }),

    _verifyContext: Promise.method(function(ctx) {
      if (!ctx.sessionRequired) {
        return;
      }

      if (!ctx.sessionId || !this._session) {
        throw new HapticService.SessionRequiredError();
      }


      if (ctx.sessionId !== this._session.id()) {
        throw new HapticService.InvalidSessionError();
      }

    }),

    onReqInitSession: Promise.method(function(){
      this._session = new Session();
      return this._session.toObject();
    }),

    onReqTestDevice: Promise.method(function(msg) {
      var pulses = msg.pulses || 1,
          pulseDuration = msg.pulseDuration || 100;

      var tail = Promise.resolve().bind(this);


      _.times(pulses, function(p) {

        tail = tail.then(function() {
          Log.debug("Pulse", p);
          return this._device
            .testPulse(pulseDuration);
        });

      }, this);

      return tail;
    }),

    onReqPulseIntArray: Promise.method(function(msg) {
      var opts = Options.fromObject(msg);

      var intArray      = opts.getOrError("intArray"),
          pulseDuration = opts.getOrElse("pulseDuration",  DEFAULT_PULSE_DURATION),
          restDuration  = opts.getOrElse("restDuration",   DEFAULT_REST_DURATION)

      Log.debug("onReqPulseIntArray", msg);

      return Promise.each(intArray, _.bind(function(num) {
        var motors = _.chain(Device.Motor).map(function(val, key) {
          if (key === "TEST") return;
          var res = 0xFFFF & num & val;
          if (res > 0) return res;
        }).compact().value();

        Log.debug("Item", num, "motors", motors);

        return Promise
          .bind(this)
          .then(function() {
            return Promise.all(_.map(motors, function(m) {
              return this._device.on(m);
            }, this));
          })
          .delay(pulseDuration)
          .then(function() {
            return Promise.all(_.map(motors, function(m) {
              return this._device.off(m);
            }, this));
          })
          .delay(restDuration);
      }, this));


    })
  });

  _.extend(HapticService, {
    SessionRequiredError: Lang.makeErrorClass("SessionRequiredError", "a session is required"),
    InvalidSessionError: Lang.makeErrorClass("InvalidSessionError", "a session was provided, but did not have ownership of the service")
  });

  var Session = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(Session.prototype, {
    initialize: function(opts) {
      opts = Options.fromObject(opts);
      this._id = opts.getOrElseFn("id", function() {
        return UUID.v4();
      });
    },


    id: function() {
      return this._id;
    },


    toObject: function() {
      return {
        sessionId: this._id
      }
    }
  });

  _.extend(Session, {
    fromObject: function(obj) {
      return new Session({
        id: obj.sessionId
      });
    }
  });

  return HapticService;
};

module.exports = mod(
  require("underscore"),
  require("bluebird"),
  require("thicket").c("lang"),
  require("thicket").c("options"),
  require("thicket").c("messaging/courier"),
  require("thicket").c("logger"),
  require("thicket").c("uuid"),
  require("../concepts/device")
);
