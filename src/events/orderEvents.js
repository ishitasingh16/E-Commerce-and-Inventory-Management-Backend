const { EventEmitter } = require('events');

const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(30);

module.exports = orderEvents;
