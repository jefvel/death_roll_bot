
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: 'database.sqlite',
});

const Stats = sequelize.define('stats', {
  id: {
    type: Sequelize.STRING,
    unique: true,
    primaryKey: true,
  },
  description: Sequelize.TEXT,
  username: Sequelize.STRING,
  currency: {
    type: Sequelize.INTEGER,
    defaultValue: 100,
    allowNull: false,
  },
  wins: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  losses: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

class Database {
  constructor() {
  }
  sync() {
    return Stats.sync();
  }

  async createUserById(id, username) {
    const user = await Stats.create({ id, username });
    return {
      id: user.id,
      currency: user.currency,
      wins: user.wins,
      losses: user.losses,
      username: user.username,
    };
  }

  async addWinToUser(id) {
    const user = await Stats.findOne({ where: { id } });
    if (user) {
      user.increment('wins');
    }
  }

  async addLossToUser(id) {
    const user = await Stats.findOne({ where: { id } });
    if (user) {
      user.increment('losses');
    }
  }

  /**
   * 
   * @param {player Id} id 
   * @param {amount to withdraw} amount 
   * @returns {amount withdrawn}
   */
  async withdraw(id, amount) {
    const user = await Stats.findOne({ where: { id } });
    if (user) {
      if (user.currency < amount) {
        amount = user.currency;
      }
      await Stats.update({currency: user.currency - amount}, { where: { id } });
    } else {
      amount = 0;
    }
    return amount;
  }

  async deposit(id, amount) {
    const user = await Stats.findOne({ where: { id } });
    if (user) {
      return await Stats.update({currency: user.currency + amount}, { where: { id } });
    }
  }

  async giveEggsToEveryone(amount) {
    return await Stats.update({ currency: sequelize.literal(`currency + ${amount}`) }, { where: {} });
  }

  async getUserById(user) {
    const player = await Stats.findOne({ where: { id : user.id } });
    if (player) {
      return {
        id: player.id,
        username: player.username,
        currency: player.currency,
        wins: player.wins,
        losses: player.losses,
      };
    } else {
      return await this.createUserById(user.id, user.username);
    }
  }
}

module.exports = Database;

