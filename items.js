const Sequelize = require('sequelize');
const Op = Sequelize.Op;

function generateItemEmbed(item) {
  const { name, description, avatar_url } = item;
  const embed = {
    title: 'Congratulations, you got an item!',
    color: 6500297,
    thumbnail: {
      url: avatar_url ? avatar_url : "https://cdn.discordapp.com/avatars/668497383629389844/8eef75049f971a09116cbf646619e59d.png"
    },
    fields: [
      {
        name,
        value: description,
      }
    ]
  };
  return { embed };
}

class Items {
  constructor(db, discord) {
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
      avatar_url: {
        type: Sequelize.STRING,
      },
    });

    this.items.belongsTo(db.players, {
      foreignKey: 'ownerID',
    });
  }

  async sync() {
    await this.items.sync({ alter: true });
  }

  async giveItemToUser(user, item, autoNotify) {
    const { name, description, avatarURL } = item;
    let res = await this.items.findOne({ where: { name, ownerID: user.id }, raw: true });
    let alreadyOwned = false;
    if (!res) {
      res = await this.items.create({ name, description, ownerID: user.id, avatar_url: avatarURL });
      res = res.get({ plain: true });
    } else {
      alreadyOwned = true;
    }

    if (!alreadyOwned && autoNotify) {
      user.send(generateItemEmbed(res));
    }

    return {
      item: res,
      alreadyOwned,
    };
  }

  async listUserItems(user) {
    const result = await this.items.findAll({ where: { ownerID: user.id }, raw: true });
    return result;
  }
}


module.exports = Items;
