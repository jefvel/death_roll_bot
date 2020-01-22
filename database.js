
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: 'database.sqlite',
});

const Players = sequelize.define('players', {
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

/** A Town is a server */
const Towns = sequelize.define('towns', {
  id: {
    type: Sequelize.STRING,
    unique: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    unique: false,
  },
  currency: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    min: 0,
  }
});

Players.belongsTo(Towns);

class Database {
  discord = null;
  constructor(discordClient) {
    this.discord = discordClient;
  }
  sync() {
    return Promise.all([
      Players.sync(),
      Towns.sync(),
    ]);
  }

  async createUser(user) {
    const usr = await Players.create({ id: user.id, username: user.username });
    return {
      id: usr.id,
      currency: usr.currency,
      wins: usr.wins,
      losses: usr.losses,
      username: usr.username,
    };
  }

  async addWinToUser(id) {
    const user = await Players.findOne({ where: { id } });
    if (user) {
      user.increment('wins');
    }
  }

  async addLossToUser(id) {
    const user = await Players.findOne({ where: { id } });
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
  async withdraw(user, amount) {
    let usr = await Players.findOne({ where: { id: user.id } });
    if (!usr) {
      usr = await this.createUser(user);
    }
    if (usr) {
      if (usr.currency < amount) {
        amount = usr.currency;
      }
      await Players.update({currency: usr.currency - amount}, { where: { id: user.id } });
    } else {
      amount = 0;
    }
    return amount;
  }

  async deposit(user, amount) {
    const usr = await Players.findOne({ where: { id: user.id } });
    if (usr) {
      return await Players.update({currency: usr.currency + amount}, { where: { id: user.id } });
    }
  }

  async getTop10Players() {
    const users = await Players.findAll({
      where: {},
      order: [
        [ 'currency', 'DESC' ],
      ],
      attributes: [ 'username', 'currency', 'id' ],
      limit: 10,
    });

    const result = Promise.all(users.map(async (u) => {
      if (u.username === null) {
        const user = await this.discord.fetchUser(u.id);
        u.username = user.username;
        this.setUsername(u.id, u.username);
      }

      return {
        username: u.username,
        currency: u.currency,
      };
    }));

    return await result;
  }

  async setUsername(id, username) {
      return await Players.update({ username: username }, { where: { id } });
  }

  async giveEggsToEveryone(amount) {
    return await Players.update({ currency: sequelize.literal(`currency + ${amount}`) }, { where: {} });
  }

  async getUser(user) {
    const player = await Players.findOne({ where: { id : user.id } });
    if (player) {
      if (!player.username) {
        player.username = user.username;
      }
      return {
        id: player.id,
        username: player.username,
        currency: player.currency,
        wins: player.wins,
        losses: player.losses,
        townId: player.townId,
      };
    } else {
      return await this.createUser(user);
    }
  }
}

module.exports = Database;

