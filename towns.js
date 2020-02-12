const Sequelize = require('sequelize');
const Op = Sequelize.Op;

/** A Town is a server */
class Towns {
  constructor(db, discord) {
    this.db = db;
    this.discord = discord;

    this.towns = db.sequelize.define('towns', {
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
      },
      x: {
        type: Sequelize.INTEGER,
      },
      y: {
        type: Sequelize.INTEGER,
      },
    });

    db.players.belongsTo(this.towns);
  }

  async sync() {
    await this.towns.sync({ alter: true });
  }

  async createTown(serverID, name) {
    const town = await this.towns.create({ id: serverID, name: name });
  }
}


module.exports = Towns;
