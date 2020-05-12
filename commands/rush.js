
const Discord = require('discord.js');

async function rush({ game, message }) {
  const { db, constants: { currency } } = game;

  const isDM = (message.channel instanceof Discord.DMChannel);

  if (isDM) {
    message.reply('You need to run this command in a group channel');
    return;
  }

  message.reply(`Not implemented yet`);

}

module.exports = rush;
