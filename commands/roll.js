const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('roll')
        .setDescription('the starting value of the roll, either a number, or "random"')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('bet')
        .setDescription('amount of :egg: to bet, can be 0, or "all"')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('required-bet')
        .setDescription(
          'Whether or not participants need the full bet amount to join'
        )
        .setRequired(false)
    )
    .setDescription('Start a game of Egg Roll'),
  async execute({ interaction, game }) {
    const runningGames = global.runningGames;

    const { db, constants: { currency } } = game;
    const { user } = interaction;

    console.log(interaction);

    if (!interaction.inGuild()) {
      interaction.reply("You can't deathroll with yourself.");
      return;
    }

    const activeGame = runningGames[interaction.channel.id];
    if (activeGame) {
      interaction.reply({
        content: 'There is already an active death roll on this channel',
        ephemeral: true,
      });
      return;
    }

    let rollArg = interaction.options.getString('roll');

    let roll = parseInt(rollArg, 10) || 100;
    if (`${rollArg}`.toLowerCase() === 'random') {
      roll = Math.floor(Math.random() * 100000) + 1;
    } else if (`${rollArg}`.toLowerCase() === 'all') {
      roll = 'all';
    }

    let betArg = interaction.options.getString('bet');

    let isRequired = interaction.options.getBoolean('required-bet');
    
    let bet = betArg ? parseInt(betArg, 10) || 0 : 0;

    let percentage = false;

    if (betArg) {
      let b = betArg;
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

      if (b.toLowerCase() === 'random') {
        bet = Math.round(Math.random() * 100);
        percentage = true;
      }
    }

    let required = false;
    if (isRequired) {
      required = true;
    }

    console.log({
      bet,
      roll,
      required,
    });

    if (roll <= 1 || bet < 0) {
      interaction.reply({
        content:
          'To start the game, type `/roll [roll amount (default: 100)] [bet amount (default: 0)]`',
        ephemeral: true,
      });
      return;
    }

    const userInfo = await db.getUser(user.id, true);

    // User can't bet more than he owns
    if (percentage) {
      bet = Math.max(0, Math.min(1, bet / 100.0));
      bet = Math.floor(userInfo.currency * bet);
    } else if (bet > userInfo.currency) {
      bet = userInfo.currency;
    }

    if (roll === 'all') {
      roll = userInfo.currency;
    }
    
    let maxRoll = 10000000000;
    if (roll > maxRoll) {
      roll = maxRoll - 1;
    }

    console.log({
      bet,
      roll,
      required,
    });

    global.startGameRoom(
      interaction,
      roll,
      bet,
      user,
      required
    );

    /*
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
      message.reply(
        'To start the game, type `/roll [roll amount (default: 100)] [bet amount (default: 0)]`'
      );
    } else {
      const userInfo = await db.getUser(message.author.id, true);

      // User can't bet more than he owns
      if (percentage) {
        bet = Math.max(0, Math.min(1, bet / 100.0));
        bet = Math.floor(userInfo.currency * bet);
      } else if (bet > userInfo.currency) {
        bet = userInfo.currency;
      }

      runningGames[message.channel.id] = new GameRoom(
        message.channel,
        roll,
        bet,
        message.author,
        required
      );
    }
    */
  },
};
