async function roll({ message, game, args }) {
  if (message.channel instanceof Discord.DMChannel) {
    message.reply("You can't deathroll with yourself.");
    return;
  }

  const activeGame = runningGames[message.channel.id];
  if (activeGame) {
    message.reply('There is already an active death roll on this channel');
    return;
  }

  const roll = parseInt(args[0], 10) || 100;


  let bet = args.length > 1 ? parseInt(args[1], 10) || -1 : 0;

  let percentage = false;

  if (args.length > 1) {
    let b = args[1];
    if (b === 'all' || b === 'allin' || b === 'max') {
      bet = Number.MAX_SAFE_INTEGER;
    }
    if (b === 'half') {
      b = '50%';
      bet = 50;
    }
    if (b.endsWith('%')) {
      percentage = true;
    }
  }

  let required = false;
  if (args.length > 2 && args[2] === 'required') {
    required = true;
  }

  if (roll <= 1 || bet < 0) {
    message.reply('To start the game, type `' + config.prefix + 'roll [roll amount (default: 100)] [bet amount (default: 0)]`')
  } else {
    const userInfo = await db.getUser(message.author.id, true);

    // User can't bet more than he owns
    if (percentage) {
      bet = Math.max(0, Math.min(1, bet / 100.0));
      bet = Math.floor(userInfo.currency * bet);
    } else if (bet > userInfo.currency) {
      bet = userInfo.currency;
    }

    runningGames[message.channel.id] = new GameRoom(message.channel, roll, bet, message.author, required);
  }
}

module.exports = roll;
