const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

function generateUserInfoEmbed(info, items, town, levelInfo) {
  const kd =
    info.losses == 0
      ? ':star::star::star:'
      : (info.wins / info.losses).toFixed(2);

  const embed = new EmbedBuilder()
    .setTitle(`${info.currency} Ägg`)
    .setDescription(
      `**${info.wins}** Wins, **${info.losses}** Losses. That's a W/L Ratio of **${kd}**\n**Totals**: Won Ägg: **${info.total_won_eggs}**. Lost Ägg: **${info.total_lost_eggs}** `
    )
    .setColor(6049602)
    .setThumbnail(levelInfo.avatarUrl)
    .setAuthor({
      name: `${info.username}, The ${levelInfo.title} (Lvl. ${levelInfo.level})`,
      iconUrl: levelInfo.avatarUrl,
    });

  /*
  {
    title: `${info.currency} Ägg`,
    description: `**${info.wins}** Wins, **${info.losses}** Losses. That's a W/L Ratio of **${kd}**\n**Totals**: Won Ägg: **${info.total_won_eggs}**. Lost Ägg: **${info.total_lost_eggs}** `,
    color: 6049602,
    thumbnail: {
      url: levelInfo.avatarUrl,
    },
    author: {
      name: `${info.username}, The ${levelInfo.title} (Lvl. ${levelInfo.level})`,
      icon_url: levelInfo.avatarUrl,
    },
    fields: [
    ]
  };
  */

  const levelProgress = levelInfo.exp / levelInfo.nextLevelExp;

  const gr = '🟩';
  const wh = '⬜';

  const ps = 20;
  let progressBar = '';
  for (let i = 0; i < ps; i++) {
    if (i / ps >= levelProgress) {
      progressBar += wh;
    } else {
      progressBar += gr;
    }
  }

  embed.addFields({
    name: `${levelInfo.exp}/${levelInfo.nextLevelExp} ÄXP`,
    value: progressBar,
  });

  /*
  embed.addFields({
    inline: true,
    name: ":cityscape: Town",
    value: town ? `**${town.name}**` : "Not a member of a town.",
  });
  */

  if (info.chickenCount > 0) {
    embed.addFields({
      inline: true,
      name: ':baby_chick: Chickens',
      value: `Owns **${info.chickenCount}** chickens\nHas eaten **${info.total_eaten_eggs}** Ägg`,
    });
  }

  if (items.length > 0) {
    let itemInfo = '';
    items.forEach((item) => {
      itemInfo += `${item.emoji} **${item.name}** - ${item.description}\n`;
    });
    embed.addFields({
      name: ':handbag: Items',
      value: itemInfo,
    });
  }

  return { embeds: [embed] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('user to stat check')
        .setRequired(false)
    )
    .setDescription('Show your or someone elses stats'),
  async execute({ interaction, game }) {
    const { db } = game;
    let id = interaction.user.id;
    let checkingOther = false;
    let userArg = interaction.options.getUser('user');
    if (userArg) {
      id = userArg.id.replace(/[<@!>]/g, '');
      checkingOther = true;
    }

    let info = null;

    try {
      info = await db.getUser(id);
    } catch (error) {
      console.log(error);
    }

    if (info == null) {
      interaction.reply({
        content:
          'Could not find player. Players are only visible after joining an death roll.',
        ephemeral: true,
      });
      return;
    }

    let levelInfo = await game.levels.getPlayerLevelInfo(id);

    const items = await game.items.listUserItems({ id });

    let town = null;
    /*
  if (info.townId) {
    town = await game.towns.getTown(info.townId);
  }
  */

    const embed = generateUserInfoEmbed(info, items, town, levelInfo);

    if (checkingOther) {
      interaction.reply({ ...embed, ephemeral: true });
    } else {
      interaction.reply({ ...embed, ephemeral: true });
    }
  },
};
