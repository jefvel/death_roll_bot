const specialRolls = require('./specialrolls');
async function coolListener(event) {
  const { game: { items } } = event;

  if (event.type === 'PLAYER_ROLL') {
    const item = specialRolls[event.roll];

    if (item) {
      const res = await items.giveItemToUser(event.user, {
        name: item.name,
        description: item.desc,
        avatarURL: item.avatarURL,
      }, true);
    }

  }
}

function registerCommands(game) {
  game.registerCommand('gibemonipls', async ({ game: { items }, message }) => {
    const item = await items.giveItemToUser(message.author, {
      name: ':yellow_circle:  Moni',
      description: 'This is money originally intended for potions. Completely useless.',
      avatarURL: 'https://cdn.discordapp.com/attachments/668497531742978100/677225697424703508/unknown.png',
    });

    if (!item.alreadyOwned) {
      message.author.send('hue hue hue');
    }
  });

  game.addEventListener(coolListener);
}

module.exports = {
  registerCommands,
};

