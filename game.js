const constants = require('./constants.js');


/**
* GameEvent
* EventType : String
* Channel : Discord.Channel
* Message : Discord.Message
* User    : Discord.User
*/

class Game {
  constructor(db, discord, logger) {
    this.db = db;
    this.discord = discord;
    this.logger = logger;
  }

  inited = false;

  eventListeners = {};
  commands = {};

  constants = constants;

  registerCommand(command, callback) {
    this.commands[command.toLowerCase()] = callback;
  }

  runCommand(command, args, message, player) {
    const cmd = this.commands[command.toLowerCase()];
    if (cmd) {
      cmd({
        command,
        args,
        message,
        game: this,
        player,
      });
    }
  }

  addEventListener(eventType, listener) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }

    this.eventListeners[eventType].push(listener);
  }

  removeEventListener(eventType, listener) {
    const e = this.eventListeners[eventType];
    if (!e) {
      return;
    }

    const i = e.indexOf(listener);
    if (i >= 0) {
      e.splice(i, 1);
    }
  }

  dispatchEvent(event) {
    event.game = this;
    const e = this.eventListeners[event.type];
    if (e) {
      e.forEach(l => l(event));
    }
  }
}

module.exports = Game;
