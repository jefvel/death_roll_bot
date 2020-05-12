const specialRolls = require('./specialrolls');
async function specialRollListener(event) {
  const { game: { items }, roll } = event;

  const item = specialRolls[roll];

  if (item) {
    const res = await items.giveItemToUser(event.user, item, true);
  }
}

function registerCommands(game) {
  game.registerCommand('gibemonipls', async ({ game: { items }, message }) => {
    const item = await items.giveItemToUser(message.author, {
      name: 'Moni',
      emoji: ':yellow_circle:',
      description: 'This is money originally intended for potions. Completely useless.',
      avatar_url: 'https://cdn.discordapp.com/attachments/668497531742978100/677225697424703508/unknown.png',
      price: 0,
    });

    if (!item.alreadyOwned) {
      message.author.send('hue hue hue');
    }
  });

  game.registerCommand('beararms', async ({ game: { items }, message }) => {
    const item = await items.giveItemToUser(message.author, {
      name: 'Gun',
      emoji: ':gun:',
      description: "It's a gun, fits in your hand just like God intended.",
      avatar_url: 'https://media.discordapp.net/attachments/668497531742978100/679422006957178900/unknown.png',
      price: 100,
    }, true);

    if (!item.alreadyOwned) {
      message.author.send('Hope you can shoot some straight up losers with this one.');
    }
  });

  game.addEventListener('PLAYER_ROLL', specialRollListener);
}

module.exports = {
  registerCommands,
};

