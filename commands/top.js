const currency = 'Ägg';

function generateTopList(topList, pageInfo) {
  const embed = {
    title: "Top Players (Egg Count)",
    color: 6049602,
    description: topList + '\n' + pageInfo,
  };

  return { embed };
}

const numEmojis = [
  '0️⃣',
  '1️⃣',
  '2️⃣',
  '3️⃣',
  '4️⃣',
  '5️⃣',
  '6️⃣',
  '7️⃣',
  '8️⃣',
  '9️⃣',
];

const blueSquare = '🟦';

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
  //const strL = `${playerCount}`.length;
  const strL = `${pageSize * (page + 1)}`.length;
  const userString = users.map((u, index) => {
    const pageStr = ('' + (pageSize * page + index + 1)).padStart(strL);
    const cStr =`${u.currency}`.padStart(9);
    let emojiStr = '';
    for (let i = 0; i < pageStr.length; i ++) {
      const char = pageStr.charAt(i);
      if (char === ' ') {
        emojiStr += blueSquare;
      } else {
        emojiStr += numEmojis[parseInt(char)];
      }
    }
    return `${emojiStr}**\`${cStr}\`** - [${u.username}](https://deathroll.net/player/${u.id})`;
  }).join('\n');
  const pageInfo = `\nPage **${page + 1}** of **${totalPages}**. Total Players: **${playerCount}**\n`;

  message.channel.send(generateTopList(userString, pageInfo));
}

module.exports = top;
