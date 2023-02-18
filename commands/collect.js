const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collect')
    .setDescription('Gather uncollected eggs'),
  async execute({ interaction, game }) {
    const { db, constants: { currency } } = game;
    const { user } = interaction;
    
    const secretReply = (msg) => interaction.reply({content: msg, ephemeral: true});

    const res = await db.makeUserCollectCurrency(user.id);

    const isDM = false; //(message.channel instanceof Discord.DMChannel);

    if (!isDM) {
      //setTimeout(() => { message.delete(); }, 5000);
    }

    if (res.collected === 0) {
      secretReply(`You don't have any :egg:${currency} to collect. Come back later`).then((msg) => {
        if (!isDM) {
          //setTimeout(() => { msg.delete(); }, 5000);
        }
      });
      return;
    }

    await db.incrementExp(user.id, res.collected * game.constants.exp_per_egg);

    secretReply(`You collected :egg:**${res.collected}** ${currency}, and now own a total of :egg:**${res.currency}** ${currency}!`).then((msg) => {
      if (!isDM) {
        //setTimeout(() => { msg.delete(); }, 5000);
      }
    });
  },
};
