const EventEmitter = require("events");
const orderEvents = new EventEmitter();

// Increase listener limit to avoid warnings in dev with many clients
orderEvents.setMaxListeners(1000);

module.exports = orderEvents;

