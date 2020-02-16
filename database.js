
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Here we load the config.json file that contains our token and our prefix values.
const config = require("./config.json");

/*
const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: 'database.sqlite',
});
*/

const sequelize = new Sequelize('deathroll', 'postgres', null, {
  host: '0.0.0.0',
  dialect: 'postgres',
  logging: false,
  // SQLite only
  //storage: 'database.sqlite',
});

const Players = sequelize.define('players', {
  id: {
    type: Sequelize.STRING,
    unique: true,
    primaryKey: true,
  },
  title: Sequelize.TEXT,
  username: Sequelize.STRING,
  currency: {
    type: Sequelize.INTEGER,
    defaultValue: 100,
    allowNull: false,
  },
  basket: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
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
  chickenCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  win_streak: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  lose_streak: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

const alter = true;

class Database {
  discord = null;
  sequelize = sequelize;

  players = Players;

  constructor(discordClient) {
    this.discord = discordClient;
  }

  sync() {
    return Promise.all([
      Players.sync({ alter }),
    ]);
  }

  async createUser(id) {
    const user = await this.discord.fetchUser(id, true);

    const usr = await Players.create({ id: user.id, username: user.username });
    return usr.get({ plain: true });
  }


  async addWinToUser(id, amount) {
    if (amount === undefined || amount === null) {
      amount = 1;
    }

    const user = await Players.findOne({ where: { id } });
    if (user) {
      user.increment('wins', { by: amount });
      user.increment('win_streak', { by: 1 });
      user.update({ lose_streak: 0 });
    }
  }

  async addLossToUser(id) {
    const user = await Players.findOne({ where: { id } });
    if (user) {
      user.increment('losses');
      user.increment('lose_streak', { by: 1 });
      user.update({ win_streak: 0 });
    }
  }

  async giveChickensToUser(id, amount) {
    if (amount === undefined || amount === null) {
      amount = 1;
    }

    const user = await Players.findOne({ where: { id } });
    if (user) {
      user.increment('chickenCount', { by: amount });
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
      usr = await this.createUser(user.id);
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

  async getPlayerCount() {
    const count = await Players.count({
      distinct: true,
      col: 'players.id'
    });

    return count;
  }

  async getTop10Players(limit, page) {
    if (!limit) {
      limit = 10;
    }

    const users = await Players.findAll({
      where: {},
      order: [
        [ 'currency', 'DESC' ],
      ],
      attributes: [ 'username', 'currency', 'id' ],
      offset: limit * page,
      limit,
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
    return await Players.update(
      { basket: sequelize.literal(`basket + 1`) },
      {
        where: {
          basket: {
            [Op.lte]: 4000
          },
        }
      }
    );
  }

  async makeUserCollectCurrency(id) {
    const user = await this.getUser(id, true);
    if (user) {
      const collectAmount = user.basket;
      const total = user.currency + user.basket;

      const result = await Players.update(
        {
          currency: sequelize.literal(`currency + ${collectAmount}`),
          basket: sequelize.literal(`basket - ${collectAmount}`),
        },
        {
          where: { id },
        }
      );

      return {
        currency: total,
        collected: collectAmount,
      }
    }
  }

  async getUser(id, createNew) {
    const player = await Players.findOne({ where: { id }, raw: true });
    if (player) {
      if (!player.username) {
        const user = await this.discord.fetchUser(id, true);
        player.username = user.username;
      }
      return player;
    } else if (createNew) {
      return await this.createUser(id);
    }

    return null;
  }
}

module.exports = Database;

