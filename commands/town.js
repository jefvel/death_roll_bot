async function town({ message, player, game }) {
  const { townId } = player;
  if (!townId) {
    message.reply("You are not a member of a town.");
    return;
  }

  const town = await game.towns.getTown(townId);
  const pop = await game.towns.getTownPopulation(townId);

  const embed = {
    title: `:cityscape: ${town.name}`,
    thumbnail: {
      url: game.constants.avatars.town,
    },
    color: 6049602,
    fields: [
      {
        inline: true,
        name: ":people_holding_hands: Town Population",
        value: `**${pop.toLocaleString()}**`,
      },
      {
        inline: true,
        name: ":egg: Town Ägg Count",
        value: `**${town.currency.toLocaleString()}**`,
      },
      {
        name: ":map: World Coordinates",
        value: `**${town.x}**, **${town.y}**`,
      },
    ]
  };

  message.reply({ embed });

}

module.exports = town;
