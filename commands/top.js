const currency = 'Ägg';

function generateTopList(topList, pageInfo) {
  const embed = {
    title: "Top Players",
    color: 6049602,
    fields: [
      {
        name: "\u200b",
        value: topList,
      },
      {
        name: "\u200b",
        value: pageInfo,
      },
    ]
  };

  return { embed };
}

async function top({ command, message, args, game }) {
  const db = game.db;
  const pageSize = 20;
  const playerCount = await db.getPlayerCount();
  const totalPages = Math.floor(playerCount / pageSize) + 1;
  let page = args.length > 0 ? parseInt(args[0]) - 1 : 0;
  if (page < 0) {
    page = 0;
  }

  if (page >= totalPages - 1) {
    page = totalPages - 1;
  }

  if (isNaN(page)) {
    return;
  }

  const users = await db.getTop10Players(pageSize, page);
  const userString = users.map((u, index) => `${pageSize * page + index + 1}. ${u.username}, :egg:**${u.currency}** ${currency}`).join('\n');
  const pageInfo = `\nPage **${page + 1}** of **${totalPages}**. Player count: **${playerCount}**\n`;

  message.channel.send(generateTopList(userString, pageInfo));
}

module.exports = top;
