const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eggrecords')
    .setDescription('List the greatest records that have happened in the game'),
  async execute({ interaction, game }) {
    const stats = game.stats;

    let keys = [];
    for (const k in stats.statsKeys) {
      keys.push(stats.statsKeys[k]);
    }

    const records = await stats.listStats(keys);

    const embed = new EmbedBuilder()
      .setTitle(':man_bowing: **Hall of Records** :woman_bowing:')
      .setDescription('Here follows some great feats')
      .setColor(0x44ff22);
    records.forEach((record) =>
      embed.addFields({
        name: `**${record.name}**`,
        value: `${record.description}`,
      })
    );
    /*
  {
    title: ":man_bowing: **Hall of Records** :woman_bowing:",
    description: 'Here follows some great feats',
    color: 0x44ff22,
    fields
  };
  */

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
