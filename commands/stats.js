function generateUserInfoEmbed(info, items, town) {
  const kd = info.losses == 0 ? ':star::star::star:' : (info.wins / info.losses).toFixed(2);

  const embed = {
    title: `${info.currency} Ägg`,
    description: `**${info.wins}** Wins, **${info.losses}** Losses. That's a W/L Ratio of **${kd}**`,
    color: 6049602,
    thumbnail: {
      url: "https://cdn.discordapp.com/attachments/668497531742978100/677232220900950046/unknown.png"
    },
    author: {
      name: info.username,
      icon_url: "https://cdn.discordapp.com/attachments/668497531742978100/677232220900950046/unknown.png"
    },
    fields: [
      {
        inline: true,
        name: ":cityscape: Town",
        value: town ? `Member of the town **${town.name}**` : "Not a member of a town.",
      },
    ]
  };

  if (info.chickenCount > 0) {
    embed.fields.push({
      inline: true,
      name: ":baby_chick: Chickens",
      value: `Owns **${info.chickenCount}** chickens`,
    });
  }

  if (items.length > 0) {
    let itemInfo = '';
    items.forEach(item => {
      itemInfo += `**${item.name}** - ${item.description}\n`;
    });
    embed.fields.push({
      name: ":handbag: Items",
      value: itemInfo,
    });
  }

  return { embed };
}

async function stats({ message, args, game }) {
  const { db } = game;
  let id = message.author.id;
  let checkingOther = false;
  if (args.length == 1) {
    id = args[0].replace(/[<@!>]/g, '');
    checkingOther = true;
  }

  const info = await db.getUser(id);

  if (info == null) {
    message.channel.send('Could not find player. Players are only visible after joining an death roll.');
    return;
  }

  const items = await game.items.listUserItems({ id });

  let town = null;
  if (info.townId) {
    town = await game.towns.getTown(info.townId);
  }

  const embed = generateUserInfoEmbed(info, items, town);

  if (checkingOther) {
    message.channel.send(embed);
  } else {
    message.reply(embed);
  }
}

module.exports = stats;
