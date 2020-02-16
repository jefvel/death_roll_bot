const specialRolls = require('./specialrolls');
async function specialRollListener(event) {
  const { game: { items }, roll } = event;

  const item = specialRolls[roll];

  if (item) {
    const res = await items.giveItemToUser(event.user, {
      name: item.name,
      description: item.desc,
      avatarURL: item.avatarURL,
    }, true);
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

  game.registerCommand('beararms', async ({ game: { items }, message }) => {
    const item = await items.giveItemToUser(message.author, {
      name: ':gun: Gun',
      description: "It's a gun, fits in your hand just like God intended.",
      avatarURL: 'https://image.shutterstock.com/image-photo/9mm-pistol-bullets-handgun-on-260nw-745848868.jpg',
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

