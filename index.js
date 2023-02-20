/**
 * invite link :
 * https://discordapp.com/oauth2/authorize?&client_id=668497383629389844&scope=bot&permissions=469837904
 * https://discordapp.com/oauth2/authorize?&client_id=668497383629389844&scope=bot&permissions=285950897152
 */

require('console-stamp')(console, 'HH:mm:ss');

require('dotenv').config();

const { env } = require('process');

// Here we load the config.json file that contains our token and our prefix values.
const config = {
  prefix: env.DISCORD_PREFIX,
  token: env.DISCORD_TOKEN,
  applicationId: env.DISCORD_APPID,
  databaseAddress: env.DB_ADDRESS,
  database: env.DB_NAME,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
};

global.config = config;
const fs = require('node:fs');
const path = require('node:path');

// Load up the discord.js library
const {
  Client,
  GatewayIntentBits,
  DMChannel,
  Collection,
  Events,
  REST,
  Routes,
} = require('discord.js');

const Database = require('./database.js');
const ChickenSpawner = require('./chickenspawner.js');
const Towns = require('./towns.js');
const Items = require('./items.js');
const Stats = require('./stats.js');
const Game = require('./game.js');
const Eggs = require('./eggs.js');
const DeathRoll = require('./deathroll.js');

const Levels = require('./levels.js');

const Notifications = require('./notifications');

const logger = require('./logger');

const numbers = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
];

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

global.discordCommands = client.commands;
global.registeredCommands = [];

const constants = require('./constants.js');
// config.token contains the bot's token
// config.prefix contains the message prefix.

function updateStatus(stat) {
  if (stat) {
    client.user.setActivity(stat);
  } else {
    client.user.setActivity(`type /egghelp for info`);
  }
}

let db = null;
let chickens = null;
let towns = null;
let items = null;
let stats = null;
let eggs = null;
let game = null;
let deathRoll = null;
let levels = null;

client.once(Events.ClientReady, async (c) => {
  logger.info(
    `Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`
  );

  updateStatus();

  db = new Database(client);
  game = new Game(db, client, logger);
  db.game = game;

  //towns = new Towns(db, client, game);
  stats = new Stats(db, client, game);
  items = new Items(db, client, game);

  levels = new Levels(game);

  console.log('initing db');
  await db.connect();
  await items.sync();
  await db.sync();
  //await towns.sync();
  console.log('initing stats');
  await stats.sync();
  console.log('initing items');

  /*
    Promise.all([
      db.sync(),
      //towns.sync(),
      //stats.sync(),
      //items.sync(),
    ]).then(async () => {
      */

  chickens = new ChickenSpawner(client, db, game);
  eggs = new Eggs(game, client);
  deathRoll = new DeathRoll(game);

  require('./commands/secret').registerCommands(game);

  game.config = config;
  game.deathRoll = deathRoll;
  game.eggs = eggs;
  game.stats = stats;
  //game.towns = towns;
  game.items = items;
  game.chickens = chickens;
  game.levels = levels;

  registerCommands(game);

  game.inited = true;

  Notifications.init(game);

  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: '10' }).setToken(config.token);

  // and deploy your commands!
  (async () => {
    try {
      console.log(
        `Started refreshing ${global.registeredCommands.length} application (/) commands.`
      );

      console.log(global.registeredCommands);

      // The put method is used to fully refresh all commands in the guild with the current set
      const data = await rest.put(
        Routes.applicationCommands(config.applicationId),
        { body: global.registeredCommands }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();

  console.log('I have been initiated');
  //});
});

function registerCommands(game) {
  game.registerCommand('roll', require('./commands/roll'));
  game.registerCommand('egghelp', require('./commands/egghelp'));
  game.registerCommand('store', require('./commands/store'));
}

client.on('guildCreate', (guild) => {
  // This event triggers when the bot joins a guild.
  logger.info(
    `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
  );
  updateStatus();
});

client.on('guildDelete', (guild) => {
  // this event triggers when the bot is removed from a guild.
  logger.info(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  updateStatus();
});

let tempStatusTimeout = null;
function tempStatus(status) {
  updateStatus(status);
  if (tempStatusTimeout != null) {
    clearTimeout(tempStatusTimeout);
  }
  tempStatusTimeout = setTimeout(() => {
    tempStatusTimeout = null;
    updateStatus();
  }, 5000);
}

const dice = '🎲';
const checkMark = '✅';
const currency = 'Ägg';

/**
 * runningGames contain GameRooms, with the channel ID as key
 */
const runningGames = {};

global.runningGames = runningGames;

class Player {
  user = null;
  username = null;
  isReady = false;
  id = null;
  eliminated = false;
  lives = null;
  finalPlacement = -1;

  reactionRemoved = true;

  bet = 0;

  constructor(user) {
    this.lives = constants.playerLives;
    this.user = user;
    this.id = user.id;
    this.isReady = false;
    this.username = user.username;
  }
}

const loadingClock = [
  ':clock12:',
  ':clock1:',
  ':clock2:',
  ':clock3:',
  ':clock4:',
  ':clock5:',
  ':clock6:',
  ':clock7:',
  ':clock8:',
  ':clock9:',
  ':clock10:',
  ':clock11:',
];

class GameRoom {
  bet = 0;
  fullBetRequired = false;
  rollAmount = 0;
  rollCount = 0;
  sameRollStreak = 0;
  channel = null;
  gameMessage = null;
  players = null;
  currentPlayerIndex = 0;
  currentMaxRoll = 0;

  userQueue = null;
  waitingForPlayers = true;
  waitingForPlayersTimeLeft = 0;
  waitingTick = 0;

  reactionCollector = null;

  eventLog = [];
  gameFinished = false;

  autoRollTimer = null;
  gameCompleted = false;

  gameCreator = null;

  interaction = null;

  constructor(interaction, rollAmount, bet, gameCreator, fullBetRequired) {
    let channelId = interaction.channelId;

    this.interaction = interaction;

    this.players = [];
    console.log(gameCreator);
    this.gameCreator = gameCreator; //client.users.cache.get(gameCreator);
    this.channel = client.channels.cache.get(channelId);
    this.rollAmount = rollAmount;
    this.bet = bet;
    this.fullBetRequired = fullBetRequired;

    this.startWaitingForPlayers();
  }

  startWaitingForPlayers() {
    logger.info(`Waiting for players on channel ${this.channel.name}`);
    this.waitingForPlayersTimeLeft = constants.waitForPlayersTime;
    this.players = [];
    this.userQueue = [];
    this.eventLog = [];
    this.interaction
      .reply(this.getTitleText() + ':timer:')
      .then(async ({ interaction }) => {
        const message = await interaction.fetchReply();
        this.gameMessage = message;
        this.interaction = interaction;
        this.gameMessage.react(dice);
        this.waitForPlayersTick();
      });
  }

  getTitleText() {
    if (this.bet == 0) {
      return `>>> Playing Death Roll for **${this.rollAmount}**. No :egg:${currency} on the line.\n\n`;
    }
    return `>>> Playing Death Roll for **${this.rollAmount}**. The bet is :egg:**${this.bet}** ${currency}.\n\n`;
  }

  async waitForPlayersTick() {
    const message = this.gameMessage;

    this.waitingForPlayersTimeLeft--;
    this.waitingTick++;
    if (this.waitingTick >= loadingClock.length) {
      this.waitingTick = 0;
    }

    /*
    const messageReacted = await client.channels.cache
      .get(this.channel.id)
      .messages.fetch(this.gameMessage.id);

    messageReacted.reactions.cache.forEach(async(reaction) => {
        const emojiName = reaction._emoji.name
        const emojiCount = reaction.count
        const reactionUsers = await reaction.users.fetch();
    });
    */

    let collected = message.reactions.cache;
    let reacts = collected.find((e) => e.emoji.name === dice);
    let users = [];

    if (reacts != null) {
      console.log(reacts.map);
      let fetchedUsers = await reacts.users.fetch();
      let usermap = Array.from(fetchedUsers.values());
      users = usermap.filter((user) => {
        return !user.bot && user.id;
      });

      console.log(users);
    }

    if (users.find((u) => u.id == this.gameCreator.id) == null) {
      users.push(this.gameCreator);
    }

    if (users.length > this.userQueue.length) {
      this.waitingForPlayersTimeLeft += 1;
    }

    this.userQueue = users;

    if (this.waitingForPlayersTimeLeft <= 0) {
      this.startGame();
      return;
    }

    let title = 'Waiting for players, please click the reaction to join.\n';
    let userInfo = '';

    if (users.length > 0) {
      userInfo = 'Players:\n';
      userInfo += users
        .map(function (u, index) {
          return `**${index + 1}**: *${u.username}*`;
        })
        .join('\n');
    }

    let joinInfo = '';
    if (users.length > 1 && this.waitingForPlayersTimeLeft > 3) {
      joinInfo = `\nClick the ${checkMark} to start the game directly`;

      const readyUsers = await this.getUsersByReaction(checkMark);
      if (readyUsers) {
        let readyCount = 0;
        for (const user of users) {
          if (readyUsers.find((u) => u.id === user.id)) {
            readyCount++;
          }
        }
        if (readyCount == users.length) {
          if (this.waitingForPlayersTimeLeft > 3) {
            this.waitingForPlayersTimeLeft = 3;
          }
        }
      } else {
        message.react(checkMark);
      }
    } else {
      this.clearReactionsByType(checkMark);
    }

    if (this.waitingForPlayersTimeLeft <= 3) {
      joinInfo = `\nStarting...`;
    }

    const titleText = this.getTitleText();

    let clock = loadingClock[this.waitingTick];
    let secondsLeft = this.waitingForPlayersTimeLeft;
    const lastCountdown = [
      ':zero:',
      ':one:',
      ':two:',
      ':three:',
      ':four:',
      ':five:',
      ':six:',
      ':seven:',
      ':eight:',
      ':nine:',
    ];
    if (this.waitingForPlayersTimeLeft < lastCountdown.length) {
      clock = lastCountdown[this.waitingForPlayersTimeLeft];
      secondsLeft = '';
    }

    const timeLeft = `${secondsLeft} ${
      this.waitingForPlayersTimeLeft > 1 ? 'seconds' : 'second'
    } left`;

    await this.editMessage(
      `${titleText}${title}${clock} ${timeLeft}\n${userInfo}${joinInfo}`
    );
    setTimeout(this.waitForPlayersTick.bind(this), 1000);
  }

  async getUsersByReaction(reaction) {
    let collected = this.gameMessage.reactions.cache;
    let reacts = collected.find((e) => e.emoji.name === reaction);
    if (reacts) {
      let fetchedUsers = await reacts.users.fetch();
      let users = Array.from(fetchedUsers.values());
      return users || null;
    }

    return null;
  }

  clearReactionsByType(reaction) {
    let collected = this.gameMessage.reactions.cache;
    let reacts = collected.find((e) => e.emoji.name === reaction);
    if (reacts) {
      reacts.remove();
    }
  }

  clearUserReactions() {
    const filter = (reaction, user) => !user.bot;
    let collected = this.gameMessage.reactions.cache;
    var r = collected.find(filter);
    if (r != null) {
      let users = r.users.cache;
      let userArray = Array.from(users.values());
      if (!userArray) {
        return;
      }

      for (var user of userArray) {
        //if (user.id !== client.user.id) {
        if (!user.bot) {
          r.users.remove(user);
        }
      }
    }
  }

  async editMessage(msg) {
    await this.interaction.editReply(msg);
    //let newMessage = await this.interaction.fetchReply();
    //this.gameMessage = newMessage;
  }

  async startGame() {
    this.waitingForPlayers = false;

    if (this.userQueue.length <= 1) {
      logger.info(`Not enough players joined on channel ${this.channel.name}`);
      this.editMessage(`${this.getTitleText()} Not enough players joined.`);
      this.finishGame();
      return;
    }

    this.currentPlayerIndex = 0;

    logger.info(`Starting game on channel ${this.channel.name}`);

    this.gameMessage.reactions
      .removeAll()
      .then(() => this.gameMessage.react(dice));
    this.currentMaxRoll = this.rollAmount;

    // Randomize player list
    this.userQueue = this.userQueue.sort(() => Math.random() - 0.5);
    this.players = this.userQueue.map((user) => {
      return new Player(user);
    });

    if (this.bet > 0) {
      await this.placeBets();
    }

    if (this.players.length <= 1) {
      this.cancelGame();
      this.finishGame();
      logger.info(`Too few players with ${currency} to bet`);
      this.editMessage(
        `${this.getTitleText()} Too few players with ${currency}. Cancelling game.`
      );
      return;
    }

    let pot = this.bet;
    for (const p of this.players) pot = Math.min(pot, p.bet);

    pot *= this.players.length;

    stats
      .updateStatIfHigher(
        stats.statsKeys.biggestPot,
        pot,
        `:eggplant: Biggest Bet`,
        `**${this.gameCreator.username}** hosted a game in which the winner will get at least :egg:**${pot}**!`
      )
      .then((record) => {
        if (record.changed) {
          //stats.broadcastNewRecord(record.stat, this.channel);
        }
      });

    await this.refreshDisplay();

    this.listenToPlayers();
    this.resetAutoRollTimer();
    this.clearReactionsByType(checkMark);

    this.sendStartMessage();
  }

  async sendStartMessage() {
    const ids = this.players.map((p) => `<@${p.id}>`).join(' ');
    const message = `Game started! :point_right:[${ids}]:point_left:`;
    const msg = await this.channel.send(message);
    setTimeout(() => {
      msg.delete();
    }, 5000);
  }

  resetAutoRollTimer() {
    if (this.autoRollTimer != null) {
      clearTimeout(this.autoRollTimer);
    }

    if (!this.gameFinished) {
      this.autoRollTimer = setTimeout(() => {
        this.autoRollTimer = null;
        this.doRoll(true);
      }, constants.turnTime * 1000);
    }
  }

  finishGame() {
    runningGames[this.channel.id] = null;

    this.gameFinished = true;

    if (this.reactionCollector !== null) {
      this.reactionCollector.stop();
      this.reactionCollector = null;
    }

    if (this.autoRollTimer != null) {
      clearTimeout(this.autoRollTimer);
    }

    this.gameMessage.reactions.removeAll();
  }

  async placeBets() {
    for (let player of this.players) {
      if (this.fullBetRequired) {
        const user = await db.getUser(player.id);
        if (user.currency < this.bet) {
          player.eliminated = true;
          continue;
        }
      }

      const bet = await db.withdraw(player.user, this.bet);
      if (bet == 0) {
        player.eliminated = true;
      }

      player.bet = bet;
    }

    this.players = this.players.filter((p) => !p.eliminated);
  }

  cancelGame() {
    if (this.bet <= 0) {
      return;
    }

    for (let player of this.players) {
      db.deposit(player.user, player.bet);
    }
  }

  doleOutEggs() {
    const losingPlayers = this.players.filter((p) => p.eliminated);
    let totalPot = 0;
    for (let p of this.players) {
      totalPot += p.bet;
    }

    let loserCount = losingPlayers.length + 1;
    const winningPlayerQueue = this.players;
    const winningPlayer = this.players[0];
    for (let player of winningPlayerQueue) {
      let amountCanWin = Math.min(player.bet * loserCount, totalPot);
      loserCount--;
      totalPot -= amountCanWin;

      if (amountCanWin < 0) {
        amountCanWin = 0;
      }

      let wonEggs = 0;
      let lostEggs = 0;

      if (amountCanWin < player.bet) {
        lostEggs = player.bet - amountCanWin;
        db.incrementTotalLostEggs(player.user.id, lostEggs);
      }

      if (amountCanWin > 0) {
        const increasedEggs = Math.max(amountCanWin - player.bet, 0);
        wonEggs = increasedEggs;
        if (increasedEggs > 0) {
          db.incrementTotalWonEggs(player.user.id, increasedEggs);
        }

        db.deposit(player.user, amountCanWin);

        logger.info(
          `Paid :egg:${amountCanWin} ${currency} to ${player.user.username}`
        );
        let msg = `Paid :egg:${amountCanWin} ${currency} to ${player.user.username}`;
        if (winningPlayer == player) {
          msg += ` (**Winner**)`;
        }

        this.eventLog.push(msg);
      }

      if (player == this.winningPlayer) {
        game.dispatchEvent({
          type: 'PLAYER_WON_ROLL',
          channel: this.channel,
          message: this.gameMessage,
          user: this.winningPlayer.user,
          currentRoll: this.currentMaxRoll,
          participants: this.players,
          player: this.winningPlayer,
          wonEggs,
          room: this,
        });
      } else {
        game.dispatchEvent({
          type: 'PLAYER_LOST_ROLL',
          channel: this.channel,
          message: this.gameMessage,
          user: player.user,
          currentRoll: this.currentMaxRoll,
          participants: this.players,
          room: this,
          player,
          lostEggs,
        });
      }
    }
  }

  gameWon() {
    this.players = this.players.sort(
      (a, b) => a.finalPlacement - b.finalPlacement
    );
    tempStatus(`${this.players[0].username} won a roll!`);
    if (this.bet > 0) {
      this.doleOutEggs();
    }
  }

  getLatestLogs() {
    var c = Math.min(4, this.eventLog.length);
    var logsMsg = '\n----------\n';

    for (var i = 0; i < c; i++) {
      logsMsg += this.eventLog[this.eventLog.length - c + i] + '\n';
    }

    if (this.eventLog.length > 0) {
      logsMsg += '----------\n';
    }

    return logsMsg;
  }

  getCurrentMaxRollInfo() {
    if (this.gameFinished) {
      return '';
    }
    return `\nCurrent Roll: **${this.currentMaxRoll}**`;
  }

  async refreshDisplay() {
    const log = this.getLatestLogs();
    const title = this.getTitleText();
    const players = this.getPlayerInfoList();
    const rollInfo = this.getCurrentMaxRollInfo();

    await this.editMessage(`${title}${players}${log}${rollInfo}`);
  }

  killCurrentPlayer() {
    var player = this.players[this.currentPlayerIndex];
    player.lives = 0;
    player.eliminated = true;
    player.finalPlacement =
      this.players.filter((e) => !e.eliminated).length - 1;

    let loseMessage = `, and was eliminated :skull:`;

    let gameFinished = this.players.filter((p) => !p.eliminated).length === 1;
    let winningPlayerIndex = this.players.findIndex((e) => !e.eliminated);

    if (gameFinished) {
      this.gameCompleted = true;
      const winningPlayer = this.players[winningPlayerIndex];
      this.winningPlayer = winningPlayer;
    }

    let winMessage = gameFinished
      ? `\n**${this.players[winningPlayerIndex].username}** won!`
      : '';

    if (winMessage !== '') {
      this.finishGame();
    }

    return `${loseMessage}${winMessage}`;
  }

  doRoll(automated) {
    let player = this.players[this.currentPlayerIndex];

    this.rollCount++;

    let roll = 1 + Math.floor(Math.random() * this.currentMaxRoll);
    let modulatedRoll = roll;

    var killMessage = '';
    var rollFailed = false;

    var livesExhausted = false;

    if (automated) {
      player.lives--;
      if (player.lives < 0) {
        player.lives = 0;
        modulatedRoll = 0;
        livesExhausted = true;
      } else {
        modulatedRoll = Math.max(1, Math.floor(roll * 0.25));
      }
    }

    if (this.currentMaxRoll === modulatedRoll) {
      this.sameRollStreak++;
    } else {
      if (this.sameRollStreak > 0) {
        const playerNames = this.players
          .filter((p) => !p.eliminated)
          .map((p) => p.username)
          .join(', ');
        stats
          .updateStatIfHigher(
            stats.statsKeys.longestRollStreak,
            this.sameRollStreak,
            `:game_die: Longest Roll Streak`,
            `**${playerNames}** rolled **${this.currentMaxRoll}** **${
              numbers[this.sameRollStreak + 1]
            }** times in a row!`
          )
          .then((record) => {
            if (record.changed) {
              stats.broadcastNewRecord(record.stat, this.channel);
            }
          });
      }
      this.sameRollStreak = 0;
    }

    let additional = '';

    let eventType = 'PLAYER_ROLL';
    if (automated) {
      eventType = 'AUTOMATED_ROLL';
    }

    game.dispatchEvent({
      type: eventType,
      channel: this.channel,
      message: this.gameMessage,
      user: player.user,
      roll: modulatedRoll,
    });

    if (modulatedRoll === 69) {
      additional = ', nice.';
    }

    if (modulatedRoll <= 1) {
      rollFailed = true;
      killMessage = this.killCurrentPlayer();

      if (!automated) {
        stats
          .updateStatIfHigher(
            stats.statsKeys.biggestRollDeath,
            this.currentMaxRoll,
            `:skull: Biggest Roll of Death`,
            `**${player.username}** rolled **1** out of **${this.currentMaxRoll}**!`
          )
          .then((record) => {
            if (record.changed) {
              stats.broadcastNewRecord(record.stat, this.channel);
            }
          });
      }
    }

    if (!automated && modulatedRoll === 2) {
      stats
        .updateStatIfHigher(
          stats.statsKeys.biggestSuddenEgg,
          this.currentMaxRoll,
          `:100: Biggest Sudden Ägg`,
          `**${player.username}** rolled **2** out of **${this.currentMaxRoll}**!`
        )
        .then((record) => {
          if (record.changed) {
            stats.broadcastNewRecord(record.stat, this.channel);
          }
        });
    }

    while (true) {
      this.currentPlayerIndex++;
      if (this.currentPlayerIndex >= this.players.length) {
        this.currentPlayerIndex = 0;
      }

      if (!this.players[this.currentPlayerIndex].eliminated) {
        break;
      }
    }

    let message = `*${player.username}* rolled a **${roll}** out of **${this.currentMaxRoll}**${additional}`;
    if (automated) {
      if (livesExhausted) {
        message = `*${player.username}* is out of auto rolls`;
      } else {
        message = `*${player.username}* autorolled a (**${roll}**) * 0.25 = **${modulatedRoll}** out of **${this.currentMaxRoll}**`;
      }
    }

    logger.info(message);

    if (killMessage.length > 0) {
      logger.info(killMessage);
      message += killMessage;
    }

    this.eventLog.push(message);

    if (!rollFailed) {
      this.currentMaxRoll = roll;
    }

    if (this.gameCompleted) {
      this.gameWon();
    }

    this.refreshDisplay();

    if (!this.gameFinished) {
      this.resetAutoRollTimer();
    }
  }

  getPlayerInfoList() {
    const onlyOneAlive = this.players.filter((e) => !e.eliminated).length == 1;

    let userOrder = this.players
      .map((u, index) => {
        let hearts = '';
        for (var i = 0; i < constants.playerLives; i++) {
          if (i < u.lives) {
            hearts += ':heart:';
          } else {
            hearts += ':black_heart:';
          }
        }

        let spaces = index < 9 ? ' ' : '';
        let info = `**\`${spaces}${index + 1}\`**: ${hearts} *${u.username}* `;

        if (!this.gameCompleted) {
          if (index == this.currentPlayerIndex) {
            info = `__${info}__ :point_left:`;
          }
        }

        if (onlyOneAlive) {
          if (!u.eliminated) {
            info = `${info} :crown:`;
          }
        }

        if (u.eliminated) {
          info = `~~${info}~~ :skull:`;
        }

        return info;
      })
      .join('\n');

    const title = 'Player Order:\n';
    return title + userOrder + '\n';
  }

  listenToPlayers() {
    const filter = (reaction, user) => {
      return reaction.emoji.name === dice && !user.bot;
    };

    this.reactionCollector = this.gameMessage.createReactionCollector({
      filter,
    });

    this.reactionCollector.on('collect', (r, user) => {
      //let users = r.users;
      let player = this.players[this.currentPlayerIndex];
      var nextId = player.id;

      if (user.id == nextId) {
        //if (users.get(nextId) != null) {
        // let player = this.players[this.currentPlayerIndex];
        this.doRoll();
      } else {
        player.reactionRemoved = true;
      }

      this.clearUserReactions();
    });

    this.reactionCollector.on('end', (collected) =>
      logger.info(`Collected ${collected.size} items`)
    );
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  console.log('interaction');
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute({ interaction, game });
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);
  }
});

client.on('message', async (message) => {
  if (message.author.bot) return;

  console.log(message);

  // Ensure player exists
  const player = await db.getUser(message.author.id, true);

  if (player.username !== message.author.username) {
    db.setUsername(message.author.id, message.author.username);
  }

  if (message.channel.type === 'dm') {
    game.dispatchEvent({
      type: 'DIRECT_MESSAGE',
      message,
      player,
    });
  }

  if (message.content.toLowerCase().indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);

  const command = args.shift().toLowerCase();

  logger.info(
    `${message.author.username} entered command: >>> ${command} ${args.join(
      ', '
    )}`
  );

  if (game !== null && game.inited) {
    game.runCommand(command, args, message, player);
  }

  if (command === 'roll') {
    if (message.channel instanceof DMChannel) {
      message.reply("You can't deathroll with yourself.");
      return;
    }

    const activeGame = runningGames[message.channel.id];
    if (activeGame) {
      message.reply('There is already an active death roll on this channel');
      return;
    }

    let roll = parseInt(args[0], 10) || 100;
    if (`${args[0]}`.toLowerCase() === 'random') {
      roll = Math.floor(Math.random() * 100000) + 1;
    } else if (`${args[0]}`.toLowerCase() === 'all') {
      roll = 'all';
    }

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

      if (b.toLowerCase() === 'random') {
        bet = Math.round(Math.random() * 100);
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

      if (roll === 'all') {
        roll = userInfo.currency;
      }

      runningGames[message.channel.id] = new GameRoom(
        message.channel,
        roll,
        bet,
        message.author,
        required
      );
    }
  }
});

global.startGameRoom = function (interaction, roll, bet, author, required) {
  runningGames[interaction.channelId] = new GameRoom(
    interaction,
    roll,
    bet,
    author,
    required
  );
};

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question() {
  readline.question('', (command) => {
    const words = command.split(' ');
    const cmd = words.shift().toLowerCase();

    if (cmd === 'say') {
      const msg = command.substr(4);
      if (msg.length > 0) {
        // towns.broadcastMessage(msg);
      }
    }

    question();
  });
}

// question();

client.login(config.token);

const express = require('express');
const app = express();
const port = 80;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
