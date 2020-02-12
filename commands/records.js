async function records({ game, message }) {
  const stats = game.stats;

  let keys = [];
  for (const k in stats.statsKeys) {
    keys.push(stats.statsKeys[k]);
  }

  const records = await stats.listStats(keys);
  const msg = records.map(record => `**${record.name}** - ${record.description}`).join('\n');
  message.channel.send(`:man_bowing: **Hall of Records** :woman_bowing:\n:first_place:--------:trophy:-------:first_place:\n${msg}`);
}

module.exports = records;
