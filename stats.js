const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const top = require('./commands/top');
const records = require('./commands/records');
const stats = require('./commands/stats');

class Stats {
  globalStats = null;

  statsKeys = {
    biggestRollDeath: 'BIGGEST_ROLL_DEATH',
    biggestSuddenEgg: 'BIGGEST_SUDDEN_EGG',
    biggestMeal: 'BIGGEST_MEAL',
    mostChickens: 'MOST_CHICKENS_PUKE',
    longestGame: 'LONGEST_GAME',
    longestRollStreak: 'LONGEST_ROLL_STREAK',
    biggestPot: 'BIGGEST_POT',

    biggestLoseStreak: 'BIGGEST_LOSE_STREAK',
    biggestWinStreak: 'BIGGEST_WIN_STREAK',
  };

  constructor(db, discord, game) {
    this.db = db;
    this.discord = discord;

    this.globalStats = db.sequelize.define('globalStats', {
      id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
      },
      value: {
        type: Sequelize.FLOAT,
      },
      name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
    });

    this.game = game;
    this.registerCommands(game);
  }

  registerCommands(game) {
    game.registerCommand('eggrecords', records);
    game.registerCommand('eggtop', top);
    game.registerCommand('eggstats', stats);
  }

  async sync() {
    await this.globalStats.sync({ alter : true });
  }

  async updateStatIfHigher(statID, statValue, statName, statDesc, channel) {
    let stat = await this.globalStats.findOne({ where: { id: statID }, raw: true });
    let changed = false;
    if (stat) {
      if (statValue > stat.value) {
        changed = true;
        stat = await this.globalStats.update({ value: statValue, name: statName, description: statDesc }, { where: { id: statID }});
        stat = await this.globalStats.findOne({ where: { id: statID }, raw: true });
      }
    } else {
        changed = true;
        stat = await this.globalStats.create({ id: statID,  value: statValue, name: statName, description: statDesc }, { raw: true });
    }

    if (channel && changed) {
      this.broadcastNewRecord(stat, channel);
    }

    return {
      changed,
      stat,
    }
  }

  broadcastNewRecord = (record, channel) => {
    const msg = `**:trumpet: New Record! :trumpet:**\n**${record.name}** - ${record.description}`;
    channel.send(msg);
    this.game.logger.info(msg);
  }

  async listStats(statIds) {
    return await this.globalStats.findAll({ where: { id: statIds }, raw: true });
  }
}

module.exports = Stats;
