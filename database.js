
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

  async createUserById(id) {
    return await Stats.create({ id });
  }

  async getUserById(id) {
    const user = await Stats.findOne({ where: { id } });
    if (user) {
      return user;
    } else {
      return await this.createUserById(id);
    }
  }
}

module.exports = Database;

