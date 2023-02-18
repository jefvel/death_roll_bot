const { SlashCommandBuilder } = require('discord.js');

const fs = require('fs');

const helpText = fs.readFileSync('./help.txt', 'utf-8');
/*
function help({ message }) {
  message.author.send(helpText);
}
*/

module.exports = {
  data: new SlashCommandBuilder()
    .setName('egghelp')
    .setDescription('Show egg roll instructions'),
  async execute({ interaction }) {
    console.log(interaction);
    await interaction.reply({content: helpText, ephemeral: true});
  },
};
