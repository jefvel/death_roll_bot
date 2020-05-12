async function contribute({ game, message, args, player }) {
  if (!player.townId) {
    message.reply('You are not part of a town. Join one by typing `d.join`');
    return;
  }

  if (args.length == 0) {
    message.reply('Please specify an amount of Ägg. `d.contribute amount`');
    return;
  }

  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    message.reply("Please specify a valid number of Ägg to contribute");
    return;
  }

  const eggs = await game.db.withdraw(player, amount);
  await game.towns.contributeToTown(player, player.townId, eggs);

  const town = await game.towns.getTown(player.townId);

  message.reply(`Contributed **${eggs}** to the town of **${town.name}**.
The town now has :egg:**${town.currency.toLocaleString()}** Ägg!`);

}

module.exports = contribute;
