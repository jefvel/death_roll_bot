class Eggs {

  eggTicker = null;

  constructor(game, discord) {
    this.game = game;
    this.registerCommands(game);
    this.startEggTicker();
  }

  registerCommands(game) {
    game.registerCommand('eggeat', require('./commands/eat'));
    game.registerCommand('eggcollect', require('./commands/collect'));
  }

  startEggTicker() {
    const amount = 2;
    this.eggTicker = setInterval(() => {
      this.game.db.giveEggsToEveryone(amount);
      //this.game.tempStatus(`Dropped ${amount} ${this.game.constants.currency} in your basket`);
    }, 60 * 1000);
  }

}

module.exports = Eggs;
