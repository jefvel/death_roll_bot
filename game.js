const constants = require('./constants.js');

/**
* GameEvent
* EventType : String
* Channel : Discord.Channel
* Message : Discord.Message
* User    : Discord.User
*/

class Game {
  constructor(db, discord) {
    this.db = db;
    this.discord = discord;
  }

  inited = false;

  eventListeners = [];
  commands = {};

  constants = constants;

  registerCommand(command, callback) {
    this.commands[command.toLowerCase()] = callback;
  }

  runCommand(command, args, message) {
    const cmd = this.commands[command.toLowerCase()];
    if (cmd) {
      cmd({
        command,
        args,
        message,
        game: this,
      });
    }
  }

  addEventListener(listener) {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener) {
    const i = this.eventListeners.indexOf(listener);
    if (i >= 0) {
      this.eventListeners.splice(i, 1);
    }
  }

  dispatchEvent(event) {
    event.game = this;
    this.eventListeners.forEach(l => l(event));
  }
}

module.exports = Game;
