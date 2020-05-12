const Discord = require('discord.js');

async function collect({ game, message }) {
  const { db, constants: { currency } } = game;

  const res = await db.makeUserCollectCurrency(message.author.id);

  const isDM = (message.channel instanceof Discord.DMChannel);

  if (!isDM) {
    setTimeout(() => { message.delete(); }, 5000);
  }

  if (res.collected === 0) {
    message.reply(`You don't have any :egg:${currency} to collect. Come back later`).then((msg) => {
      if (!isDM) {
        setTimeout(() => { msg.delete(); }, 5000);
      }
    });
    return;
  }

  await db.incrementExp(message.author.id, res.collected * game.constants.exp_per_egg);

  message.reply(`You collected :egg:**${res.collected}** ${currency}, and now own a total of :egg:**${res.currency}** ${currency}!`).then((msg) => {
    if (!isDM) {
      setTimeout(() => { msg.delete(); }, 5000);
    }
  });
}

module.exports = collect;
