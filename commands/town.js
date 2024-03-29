async function town({ message, player, game }) {
  const { townId } = player;
  if (!townId) {
    message.reply("You are not a member of a town.");
    return;
  }

  const town = await game.towns.getTown(townId);
  const members = await game.towns.getTownMembers(townId);
  const membersList = members.map(m => `[${m.username}](https://deathroll.net/player/${m.id}), contributed \`${m.town_contribution}\` Ägg`).join('\n');
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
        name: ":egg: Town Ägg Count",
        value: `**${town.currency.toLocaleString()}**`,
      },
      {
        inline: true,
        name: ":map: World Coordinates",
        value: `:cityscape: [**${town.x}**, **${town.y}**](https://deathroll.net/map?town=${town.id})`,
      },
      {
        name: ":people_holding_hands: Town Members",
        value: membersList,
      },
    ]
  };

  message.reply({ embed });

}

module.exports = town;
