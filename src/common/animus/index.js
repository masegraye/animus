/*global require: false, module: false */
"use strict";

var mod = function(
  ComponentRegistry

) {
  var c = new ComponentRegistry();


  c.registerMany([
    {
      module: require("./clients/haptic-client"),
      as: "haptic-client"
    },
    {
      module: require("./services/haptic-service"),
      as: "haptic-service"
    },
    {
      module: require("./services/haptic-service/devices/device"),
      as: "device"
    },
    {
      module: require("./services/haptic-service/devices/simulated-device"),
      as: ["simulated-device", "devices/simulated"]
    },
    {
      module: require("./services/haptic-service/devices/local-device"),
      as: ["local-device", "devices/local"]
    }
  ]);

  return c;
};

var g = (typeof window === "undefined" ? {} : window);
g.thicket = module.exports = mod(
  require("thicket").c("component-registry")
);
