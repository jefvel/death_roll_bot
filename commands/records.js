async function records({ game, message }) {
  const stats = game.stats;

  let keys = [];
  for (const k in stats.statsKeys) {
    keys.push(stats.statsKeys[k]);
  }

  const records = await stats.listStats(keys);
  const fields = records.map(record => {
    return {
      name: `**${record.name}**`,
      value: `${record.description}`,
    };
  });

  const embed = {
    title: ":man_bowing: **Hall of Records** :woman_bowing:",
    description: 'Here follows some great feats',
    color: 0x44ff22,
    fields
  };

  message.channel.send({ embed });
}

module.exports = records;

