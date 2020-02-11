/**
 * invite link :
 * https://discordapp.com/oauth2/authorize?&client_id=668497383629389844&scope=bot&permissions=469837904
 */

require('console-stamp')(console, 'HH:mm:ss');

// Load up the discord.js library
const Discord = require('discord.js');

const Database = require('./database.js');
const ChickenSpawner = require('./chickenspawner.js');


const fs = require('fs');

const helpText = fs.readFileSync('./help.txt', 'utf-8');

const statsKeys = {
  biggestRollDeath: 'BIGGEST_ROLL_DEATH',
  biggestSuddenEgg: 'BIGGEST_SUDDEN_EGG',
  biggestMeal: 'BIGGEST_MEAL',
  longestGame: 'LONGEST_GAME',
  longestRollStreak: 'LONGEST_ROLL_STREAK',
  biggestPot: 'BIGGEST_POT',
};

const numbers = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  'fifteen', 'sixteen', 'seventeen',
];


// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values.
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

function updateStatus(stat) {
  if (stat) {
    client.user.setActivity(stat);
  } else {
    client.user.setActivity(`type ${config.prefix}help for info`);
  }
}

let eggTicker = null;

let db = null;
let chickens = null;
client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    updateStatus();

    db = new Database(client);
    db.sync().then(() => {
      chickens = new ChickenSpawner(client, db);
      const amount = 1;
      eggTicker = setInterval(() => {
        db.giveEggsToEveryone(amount);
        tempStatus(`Dropped ${amount} ${currency} in your basket`);
      }, 60 * 1000);
    });
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    updateStatus();
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
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
const checkMark = '✅'; //':white_check_mark:'; //'✔️';
const currency = 'Ägg';

/**
* runningGames contain GameRooms, with the channel ID as key
*/
const runningGames = {};

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
    this.lives = config.playerLives;
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

  constructor(channel, rollAmount, bet, gameCreator, fullBetRequired) {
    this.players = [];
    this.gameCreator = gameCreator;
    this.channel = channel;
    this.rollAmount = rollAmount;
    this.bet = bet;
    this.fullBetRequired = fullBetRequired;

    this.startWaitingForPlayers();
  }

  startWaitingForPlayers() {
    console.log(`Waiting for players on channel ${this.channel.name}`);
    this.waitingForPlayersTimeLeft = config.waitForPlayersTime;
    this.players = [];
    this.userQueue = [];
    this.eventLog = [];
    this.channel.send(this.getTitleText() + ':timer:').then(msg => {
      msg.react(dice);
      this.gameMessage = msg;
      this.waitForPlayersTick();
    });
  }

  getTitleText() {
    if (this.bet == 0) {
      return `>>> Playing Death Roll for **${this.rollAmount}**. No :egg:${currency} on the line.\n\n`;
    }
    return `>>> Playing Death Roll for **${this.rollAmount}**. The bet is :egg:**${this.bet}** ${currency}.\n\n`;
  }

  waitForPlayersTick() {
    const message = this.gameMessage;

    this.waitingForPlayersTimeLeft --;
    this.waitingTick ++;
    if (this.waitingTick >= loadingClock.length) {
      this.waitingTick = 0;
    }

    let collected = message.reactions;
    let reacts = collected.find(e => e.emoji.name === dice);
    let users = [];

    if (reacts != null) {
        users = reacts.users.filter(user => { return !user.bot; }).array();
    }

    if (users.find(u => u.id == this.gameCreator.id) == null) {
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
        userInfo += users.map((u, index) => `**${index + 1}**: *${u.username}*`).join('\n');
    }

    let joinInfo = '';
    if (users.length > 1 && this.waitingForPlayersTimeLeft > 3) {
      joinInfo = `\nClick the ${checkMark} to start the game directly`;

      const readyUsers = this.getUsersByReaction(checkMark);
      if (readyUsers) {
        let readyCount = 0;
        for (const user of users) {
          if (readyUsers.find(u => u.id === user.id)) {
            readyCount ++;
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
    const lastCountdown = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:'];
    if (this.waitingForPlayersTimeLeft < lastCountdown.length) {
      clock = lastCountdown[this.waitingForPlayersTimeLeft];
      secondsLeft = '';
    }

    const timeLeft = `${secondsLeft} ${this.waitingForPlayersTimeLeft > 1 ? 'seconds' : 'second'} left`;

    message.edit(`${titleText}${title}${clock} ${timeLeft}\n${userInfo}${joinInfo}`).then(msg => {
        this.gameMessage = msg;
        setTimeout(this.waitForPlayersTick.bind(this), 1000);
    })
  }

  getUsersByReaction(reaction) {
    let collected = this.gameMessage.reactions;
    let reacts = collected.find(e => e.emoji.name === reaction);
    if (reacts) {
      let users = reacts.users;
      let userArray = users.array();
      return userArray || null;
    }

    return null
  }

  clearReactionsByType(reaction) {
    let collected = this.gameMessage.reactions;
    let reacts = collected.find(e => e.emoji.name === reaction);
    if (reacts) {
      reacts.remove();
    }
  }

  clearUserReactions() {
    const filter = (reaction, user) => !user.bot;
    var r = this.gameMessage.reactions.find(filter);
    if (r != null) {
      let users = r.users;
      let userArray = users.array();
      if (!userArray) {
        return;
      }

      for (var user of userArray) {
        if (user.id !== client.user.id) {
          r.remove(user);
        }
      }
    }
  }

  async startGame() {
    this.waitingForPlayers = false;

    if (this.userQueue.length <= 1) {
      console.log(`Not enough players joined on channel ${this.channel.name}`);
      this.gameMessage.edit(`${this.getTitleText()} Not enough players joined.`);
      this.finishGame();
      return;
    }

    this.currentPlayerIndex = 0;

    console.log(`Starting game on channel ${this.channel.name}`);

    this.gameMessage.clearReactions().then(() => this.gameMessage.react(dice));
    this.currentMaxRoll = this.rollAmount;

    // Randomize player list
    this.userQueue = this.userQueue.sort(() => Math.random() - 0.5);
    this.players = this.userQueue.map(user => {
      return new Player(user);
    });

    if (this.bet > 0) {
      await this.placeBets();
    }

    if (this.players.length <= 1) {
      this.cancelGame();
      this.finishGame();
      console.log(`Too few players with ${currency} to bet`);
      this.gameMessage.edit(`${this.getTitleText()} Too few players with ${currency}. Cancelling game.`);
      return;
    }

    let pot = this.bet;
    for (const p of this.players) pot = Math.min(pot, p.bet);

    pot *= this.players.length;

    db.updateStatIfHigher(
      statsKeys.biggestPot,
      pot,
      `:eggplant: Biggest Bet`, `**${this.gameCreator.username}** hosted a game in which the winner will get at least :egg:**${pot}**!`,
    ).then(record => {
      if (record.changed) {
        broadcastNewRecord(record.stat, this.channel);
      }
    });

    this.refreshDisplay();
    this.listenToPlayers();
    this.resetAutoRollTimer();
    this.clearReactionsByType(checkMark);

    this.sendStartMessage();
  }

  async sendStartMessage() {
    const ids = this.players.map(p => `<@${p.id}>`).join(' ');
    const message = `Game started! :point_right:[${ids}]:point_left:`;
    const msg = await this.channel.send(message);
    setTimeout(() => { msg.delete(); }, 5000);
  }

  resetAutoRollTimer() {
    if (this.autoRollTimer != null) {
      clearTimeout(this.autoRollTimer);
    }

    if (!this.gameFinished) {
      this.autoRollTimer = setTimeout(() => {
        this.autoRollTimer = null;
        this.doRoll(true);
      }, config.turnTime * 1000);
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

    this.gameMessage.clearReactions();
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

    this.players = this.players.filter(p => !p.eliminated);
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
    const losingPlayers = this.players.filter(p => p.eliminated);
    let totalPot = 0;
    for (let p of this.players) {
      totalPot += p.bet;
    }

    let loserCount = losingPlayers.length + 1;
    const winningPlayerQueue = this.players;
    const winningPlayer = this.players[0];
    for (let player of winningPlayerQueue) {
      let amountCanWin = Math.min(player.bet * loserCount, totalPot);
      loserCount --;
      totalPot -= amountCanWin;

      db.deposit(player.user, amountCanWin);

      console.log(`Paid :egg:${amountCanWin} ${currency} to ${player.user.username}`);
      let msg = `Paid :egg:${amountCanWin} ${currency} to ${player.user.username}`;
      if (winningPlayer == player) {
        msg += ` (**Winner**)`;
      }

      this.eventLog.push(msg);

      if (totalPot <= 0) {
        break;
      }
    }
  }

  gameWon() {
    this.players = this.players.sort((a, b) => a.finalPlacement - b.finalPlacement);
    tempStatus(`${this.players[0].username} won a roll!`);
    if (this.bet > 0) {
      this.doleOutEggs();
    }
  }

  getLatestLogs() {
    var c = Math.min(4, this.eventLog.length);
    var logsMsg = '\n----------\n';

    for (var i = 0; i < c; i ++) {
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

  refreshDisplay() {
    const log = this.getLatestLogs();
    const title = this.getTitleText();
    const players = this.getPlayerInfoList();
    const rollInfo = this.getCurrentMaxRollInfo();

    this.gameMessage.edit(`${title}${players}${log}${rollInfo}`);
  }

  killCurrentPlayer() {
    var player = this.players[this.currentPlayerIndex];
    player.lives = 0;
    player.eliminated = true;
    player.finalPlacement = this.players.filter(e => !e.eliminated).length - 1;

    db.addLossToUser(player.id);

    let loseMessage = `, and was eliminated :skull:`;

    let gameFinished = this.players.filter(p => !p.eliminated).length === 1;
    let winningPlayerIndex = this.players.findIndex(e => !e.eliminated);

    if (gameFinished) {
      this.gameCompleted = true;
      const winningPlayer = this.players[winningPlayerIndex];
      db.addWinToUser(winningPlayer.id, this.players.length - 1);
    }

    let winMessage = gameFinished ? `\n**${this.players[winningPlayerIndex].username}** won!` : '';

    if (winMessage !== '') {
      this.finishGame();
    }

    return (`${loseMessage}${winMessage}`);
  }

  doRoll(automated) {
    let player = this.players[this.currentPlayerIndex];

    this.rollCount ++;

    let roll = 1 + Math.floor((Math.random() * this.currentMaxRoll));
    let modulatedRoll = roll;

    var killMessage = '';
    var rollFailed = false;

    var livesExhausted = false;

    if (automated) {
      player.lives --;
      if (player.lives < 0) {
        player.lives = 0;
        modulatedRoll = 0;
        livesExhausted = true;
      } else {
        modulatedRoll = Math.max(1, Math.floor(roll * 0.25));
      }
    }

    if (this.currentMaxRoll === modulatedRoll) {
      this.sameRollStreak ++;
    } else {
      if (this.sameRollStreak > 0) {
        const playerNames = this.players.filter(p => !p.eliminated).map(p => p.username).join(', ');
        db.updateStatIfHigher(
          statsKeys.longestRollStreak,
          this.sameRollStreak,
          `:game_die: Longest Roll Streak`, `**${playerNames}** rolled **${this.currentMaxRoll}** **${numbers[this.sameRollStreak + 1]}** times in a row!`,
        ).then(record => {
          if (record.changed) {
            broadcastNewRecord(record.stat, this.channel);
          }
        });
      }
      this.sameRollStreak = 0;
    }

    let additional = '';

    if (modulatedRoll === 69) {
      additional = ', nice.';
    }

    if (modulatedRoll <= 1) {
      rollFailed = true;
      killMessage = this.killCurrentPlayer();

      if (!automated) {
        db.updateStatIfHigher(
          statsKeys.biggestRollDeath,
          this.currentMaxRoll,
          `:skull: Biggest Roll of Death`, `**${player.username}** rolled **1** out of **${this.currentMaxRoll}**!`
        ).then(record => {
          if (record.changed) {
            broadcastNewRecord(record.stat, this.channel);
          }
        });
      }
    }

    if (!automated && modulatedRoll === 2) {
      db.updateStatIfHigher(
        statsKeys.biggestSuddenEgg,
        this.currentMaxRoll,
        `:100: Biggest Sudden Ägg`, `**${player.username}** rolled **2** out of **${this.currentMaxRoll}**!`
      ).then(record => {
        if (record.changed) {
          broadcastNewRecord(record.stat, this.channel);
        }
      });
    }

    while (true) {
      this.currentPlayerIndex ++;
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

    if (killMessage.length > 0) {
      message += killMessage;
    }

    console.log(message);

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
    const onlyOneAlive = this.players.filter(e => !e.eliminated).length == 1;

    let userOrder = this.players.map((u, index) => {
      let hearts = '';
      for (var i = 0; i < config.playerLives; i ++) {
        if (i < u.lives) {
          hearts += ':heart:';
        } else {
          hearts += ':black_heart:';
        }
      }

      let spaces = index < 9 ? ' ' : '';
      let info = `**\`${spaces}${(index + 1)}\`**: ${hearts} *${u.username}* `;

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
    }).join('\n');

    const title = 'Player Order:\n';
    return title + userOrder + '\n';
  }

  listenToPlayers() {
    const filter = (reaction, user) => reaction.emoji.name === dice && !user.bot;
    this.reactionCollector = this.gameMessage.createReactionCollector(filter);

    this.reactionCollector.on('collect', r => {
      let users = r.users;
      let player = this.players[this.currentPlayerIndex];
      var nextId = player.id;

      if (users.get(nextId) != null) {
        // let player = this.players[this.currentPlayerIndex];
        this.doRoll();
      } else {
        player.reactionRemoved = true;
      }

      this.clearUserReactions();
    });

    this.reactionCollector.on('end', collected => console.log(`Collected ${collected.size} items`));
  }
}

client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if (message.content.toLowerCase().indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  console.log(`${message.author.username} entered command: \n >>> ${command} ${args.join(', ')}`);

  if (command === 'roll') {
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

  if (command === 'stats') {
    let id = message.author.id;
    let checkingOther = false;
    if (args.length == 1) {
      id = args[0].replace(/[<@!>]/g, '');
      checkingOther = true;
    }

    const info = await db.getUser(id);

    if (info == null) {
      message.channel.send('Could not find player. Players are only visible after joining an death roll.');
      return;
    }

    const kd = info.losses == 0 ? ':star::star::star:' : (info.wins / info.losses).toFixed(2);
    const v = !checkingOther ? 'you have' : `${info.username} has`;
    let reply = `${v} :egg:**${info.currency}** ${currency}, **${info.wins}** wins and **${info.losses}** losses. That's a W/L ratio of **${kd}**`;
    if (!info.townId) {
      const v = !checkingOther ? 'You are' : `${info.username} is not`;
      reply += `\n${v} not a member of a town`;
    }

    if (info.chickenCount > 0) {
      const v = !checkingOther ? 'You have' : `${info.username} has`;
      reply += `\n${v} **${info.chickenCount}** :baby_chick: chicken${info.chickenCount > 1 ? 's': ''}`;
    }

    if (checkingOther) {
      message.channel.send(reply);
    } else {
      message.reply(reply);
    }
  }

  if (command === 'help') {
    message.author.send(helpText);
    return;
  }

  if (command === 'top') {
    const playerCount = await db.getPlayerCount();
    const pageSize = 20;
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

    message.channel.send(`>>> **Top Players**\n${userString}\n${pageInfo}`);
  }

  if (command === 'collect') {
    const res = await db.makeUserCollectCurrency(message.author.id);

    const isDM = (message.channel instanceof Discord.DMChannel);

    if (!isDM) {
      setTimeout(() => { message.delete(); }, 5000);
    }

    if (res.collected === 0) {
      message.reply(`You don't have any :egg:${currency} to collect. Come back later`).then((msg) => {
        if (!isDM) {
          setTimeout(() => { msg.delete(); }, 5000);
        }
      });
      return;
    }

    message.reply(`You collected :egg:**${res.collected}** ${currency}, and now own a total of :egg:**${res.currency}** ${currency}!`).then((msg) => {
      if (!isDM) {
        setTimeout(() => { msg.delete(); }, 5000);
      }
    });
  }

  if (command === 'eat') {
    let amount = args.length > 0 ? (parseInt(args[0], 10) || 1) : 1;
    amount = Math.max(1, amount);

    const user = await db.getUser(message.author.id, true);
    if (user.currency < amount) {
      message.reply(`You can't eat that many :egg:${currency}, you only have :egg:**${user.currency}** ${currency}`);
      return;
    }

    await db.withdraw(message.author, amount);

    message.channel.send(`${message.author} ate :egg:**${amount}** ${currency}. What a meal!`);

    const a = Math.min(amount, Math.floor(config.chickenSpawnChance / (Math.random() / amount)));

    if (a > 0) {
      chickens.giveChickensToUser(message.author, message.channel, a);
    }

    const record = await db.updateStatIfHigher(statsKeys.biggestMeal, amount, `:cooking: Biggest Meal`, `**${user.username}** ate the biggest meal: **${amount}** Ägg!`);
    if (record.changed) {
      broadcastNewRecord(record.stat, message.channel);
    }
  }

  if (command === 'records') {
    let keys = [];
    for (const k in statsKeys) {
      keys.push(statsKeys[k]);
    }
    const records = await db.listStats(keys);
    const msg = records.map(record => `**${record.name}** - ${record.description}`).join('\n');
    message.channel.send(`:man_bowing: **Hall of Records** :woman_bowing:\n:first_place:--------:trophy:-------:first_place:\n${msg}`);
  }
});

function broadcastNewRecord(record, channel) {
  const msg = `**:trumpet: New Record! :trumpet:**\n**${record.name}** - ${record.description}`;
  channel.send(msg);
  console.log(msg);
}

client.login(config.token);

/*
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question() {
  readline.question('>', (command) => {
    const words = command.split(' ');
    const cmd = words.shift().toLowerCase();

    if (cmd === 'say') {
      const msg = command.substr(4);
      if (msg.length > 0) {
      }
    }

    question();
  });
}
*/

//question();


