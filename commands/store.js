const FormPrompt = require('../formprompt');

class StorePrompt extends FormPrompt {
  constructor(user, game, message, player) {
    super(user, game);
    this.user = user;
    this.message = message;
    this.onInit();
  }

  onInit() {
    this.user.send('Hello, and welcome to the store');
  }

  onMessage(msg) {
    this.close();
  }
}

async function store({ game, user, player, message }) {
  new StorePrompt(message.author, game, message, player);
}

module.exports = store;

