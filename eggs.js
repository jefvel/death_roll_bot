class Eggs {

  eggTicker = null;

  constructor(game, discord) {
    this.game = game;
    this.registerCommands(game);
    this.startEggTicker();
  }

  registerCommands(game) {
    game.registerCommand('eat', require('./commands/eat'));
    game.registerCommand('collect', require('./commands/collect'));
  }

  startEggTicker() {
    const amount = 1;
    this.eggTicker = setInterval(() => {
      this.game.db.giveEggsToEveryone(amount);
      //this.game.tempStatus(`Dropped ${amount} ${this.game.constants.currency} in your basket`);
    }, 60 * 1000);
  }

}

module.exports = Eggs;
