const Sequelize = require('sequelize');
const Op = Sequelize.Op;

/** A Town is a server */
class Towns {
  constructor(db, discord, game) {
    this.db = db;
    this.discord = discord;
    this.game = game;

    this.towns = db.sequelize.define('towns', {
      id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
      },
      channel_id: {
        type: Sequelize.STRING,
        unique: true,
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

    this.registerCommands(game);
  }

  registerCommands(game) {
    game.registerCommand('town', require('./commands/town'));
    game.registerCommand('join', require('./commands/join'));
    game.registerCommand('config', require('./commands/config'));
    game.registerCommand('contribute', require('./commands/contribute'));
  }

  async sync() {
    await this.towns.sync({ alter: true });
  }

  async contributeToTown(serverID, amount) {
    const town = await this.towns.findOne({ where: { id: serverID } });
    if (town) {
      await town.increment('currency', { by: amount });
    }
  }

  async getTown(serverID) {
    const town = await this.towns.findOne({ where: { id: serverID } });
    if (town) {
      const t = town.get({ plain: true });
      t.channel = this.discord.channels.get(t.channel_id);
      return t;
    }
    return null;
  }

  async addUserToTown(user, serverID) {
    const town = await this.getTown(serverID);
    if (!town) {
      throw "town doesn't exist";
    }

    const player = await this.game.db.players.findOne({ where: { id: user.id }});
    if (player) {
      await player.update({
        townId: serverID,
      });
    }

    this.game.dispatchEvent({
      type: 'PLAYER_JOINED_TOWN',
      user,
      player: player.get({ plain: true }),
      town,
    });
  }

  /**
   * broadcastMessage broadcasts a message to all registered towns.
   */
  async broadcastMessage(msg) {
    const towns = await this.towns.findAll({ attributes: [ 'channel_id' ]}, { plain: true });
    const embed = {
      title: `Cool Event`,
      description: msg,
      thumbnail: {
        url: this.game.constants.avatars.surprise,
      },
      color: 6049602,
    };

    for (const town of towns) {
      const chan = this.discord.channels.get(town.channel_id);
      if (chan) {
        chan.send({ embed });
      }
    }
  }

  async getTownPopulation(serverID) {
    return await this.game.db.players.count({ where: { townId: serverID } });
  }

  async createTown(serverID, channelID, name) {
    const existingTown = await this.getTown(serverID);
    if (existingTown) {
      throw 'town exists';
    }

    const existingCoords = await this.towns.findAll({ attributes: ['x', 'y']}, { plain: true });
    console.log(existingCoords);

    var found = false;
    var x = 0;
    var y = 0;

    while(!found) {
      found = true;
      x = Math.floor(Math.random() * this.game.constants.worldWidth);
      y = Math.floor(Math.random() * this.game.constants.worldHeight);
      for (let coord of existingCoords) {
        if (!found) { break; }
        if (x == coord.x && y == coord.y) {
          found = false;
          break;
        }
      }
    }

    const town = await this.towns.create({ id: serverID, channel_id: channelID, name: name, x, y });

    const embed = {
      "title": `The town of **${name}** has been founded!`,
      "description": "This server now has a town!\n Join it by typing `d.join`.",
      "color": 14942427,
      "thumbnail": {
        "url": this.game.constants.avatars.town,
      },
    };

    const chan = this.discord.channels.get(channelID);
    chan.send({ embed });
  }
}

module.exports = Towns;

