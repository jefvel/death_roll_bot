const Sequelize = require('sequelize');
const Op = Sequelize.Op;

function generateItemEmbed(item) {
  const { name, description, avatar_url, emoji } = item;
  const title = `${emoji} ${name}`;
  const embed = {
    title: 'Congratulations, you got an item!',
    color: 6500297,
    thumbnail: {
      url: avatar_url ? avatar_url : "https://cdn.discordapp.com/avatars/668497383629389844/8eef75049f971a09116cbf646619e59d.png"
    },
    fields: [
      {
        name: title,
        value: description,
      }
    ]
  };
  return { embed };
}

class Items {
  constructor(db, discord, game) {
    this.db = db;
    this.discord = discord;

    this.items = db.sequelize.define('items', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        unique: false,
      },
      description: {
        type: Sequelize.STRING,
      },
      emoji: {
        type: Sequelize.STRING,
      },
      avatar_url: {
        type: Sequelize.STRING,
      },
      price: {
        type: Sequelize.INTEGER,
      },
    });

    this.playerItems = db.sequelize.define('player_items', {
    });

    /*
    this.items.belongsTo(db.players, {
      foreignKey: 'ownerID',
    });
    */

    this.items.belongsToMany(db.players, {through: this.playerItems});
    db.players.belongsToMany(this.items, {through: this.playerItems});

    this.game = game;
  }

  registerItems(items) {
  }

  async sync() {
    await this.playerItems.sync({ alter: true });
    await this.items.sync({ alter: true });
  }

  async getOrCreateItem(item) {
    const [res, created] = await this.items.findOrCreate({ where: { name: item.name }, defaults: item });
    return res;
  }

  async giveItemToUser(user, item, autoNotify) {
    const { name, description, avatar_url, emoji } = item;

    const existing = await this.getOrCreateItem(item);
    const player = await this.game.db.players.findByPk(user.id);

    const ownedItem = await this.playerItems.findOne({ where: { playerId: user.id, itemId: existing.id }});
    const alreadyOwned = ownedItem !== null;

    if (!alreadyOwned) {
      await this.playerItems.create({ playerId: user.id, itemId: existing.id });
    }

    if (!alreadyOwned) {
      this.game.logger.info(`Gave ${user.username} item ${name}.`);
    }

    if (!alreadyOwned && autoNotify) {
      user.send(generateItemEmbed(existing));
    }

    return {
      item: existing,
      alreadyOwned,
    };
  }

  async listUserItems(user) {
    const res = await this.game.db.players.findByPk(user.id, {
      include: [{
        model: this.items,
      }],
    });

    return res.get({ plain: true }).items;
  }
}


module.exports = Items;
