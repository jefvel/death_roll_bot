const FormPrompt = require('../formprompt');

class TownJoinPrompt extends FormPrompt {
  constructor(user, game, message) {
    super(user, game);

    this.user = user;
    this.message = message;
    this.guild = message.channel.guild;
  }

  onMessage(msg) {
    this.close();

    if (msg.content.toLowerCase() !== 'join') {
      this.sendMessage("Okay, maybe some other time.");
      return;
    }

    this.game.towns.addUserToTown(this.user, this.guild.id);
    this.sendMessage("Very nice! You are now part of the town!");
  }
}

async function join({ game, message, player }) {
  if (!message.channel || !message.channel.guild) {
    message.author.send('Please enter `d.join` in a channel on a server you want to join.');
    return;
  }

  const { guild } = message.channel;
  const { towns } = game;

  if (!guild.available) {
    message.author.send('This server is not available. Try another one');
    return;
  }

  const pop = await towns.getTownPopulation(guild.id);

  const { townChangeCost } = game.constants;

  if (player.townId && player.currency < townChangeCost) {
    message.author.send(`The moving company costs :egg:**${townChangeCost}** Ägg. You only have :egg:**${player.currency}** Ägg`)
    return;
  }

  const town = await towns.getTown(guild.id);
  if (!town) {
    message.author.send('A town has not been founded yet. Ask a server admin to run `d.config` to set it up.');
    return;
  }

  const embed = {
    title: `Join town __${guild.name}__`,
    description: `Are you sure you want to join the town **${guild.name}**?
Once joining a town, it will cost **${townChangeCost}** Ägg to move to another one.
Type \`join\` to confirm. Typing anything else will cancel.`,
    thumbnail: {
      url: game.constants.avatars.move,
    },
    color: 6049602,
    fields: [
      {
        inline: true,
        name: ":cityscape: Town Population",
        value: `**${pop.toLocaleString()}**`,
      },
      {
        inline: true,
        name: ":egg: Town Ägg Count",
        value: `**${town.currency.toLocaleString()}**`,
      },
    ]
  };

  message.author.send({ embed });

  new TownJoinPrompt(message.author, game, message);
}

module.exports = join;
