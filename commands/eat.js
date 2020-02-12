async function eat({ message, game, args }) {
  const { db, chickens, stats } = game;
  const { currency } = game.constants;

  let amount = args.length > 0 ? (parseInt(args[0], 10) || 1) : 1;
  amount = Math.max(1, amount);

  const user = await db.getUser(message.author.id, true);
  if (user.currency < amount) {
    message.reply(`You can't eat that many :egg:${currency}, you only have :egg:**${user.currency}** ${currency}`);
    return;
  }

  await db.withdraw(message.author, amount);

  message.channel.send(`${message.author} ate :egg:**${amount}** ${currency}. What a meal!`);

  const a = Math.min(amount, Math.floor(game.config.chickenSpawnChance / (Math.random() / amount)));

  if (a > 0) {
    chickens.giveChickensToUser(message.author, message.channel, a);
  }

  const record = await stats.updateStatIfHigher(
    stats.statsKeys.biggestMeal, amount, `:cooking: Biggest Meal`, `**${user.username}** ate the biggest meal: **${amount}** Ägg!`
  );

  if (record.changed) {
    stats.broadcastNewRecord(record.stat, message.channel);
  }
}

module.exports = eat;

