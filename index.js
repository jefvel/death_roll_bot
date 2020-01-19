/**
 * invite link : 
 * https://discordapp.com/oauth2/authorize?&client_id=668497383629389844&scope=bot&permissions=469837904
 */
// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user.setActivity(`I am death roll`);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

var gameStarted = false;
var waitingForPlayers = false;
var lastRoll = 0;
var nextIndex = 0;
var playerQueue = [];

const dice = '🎲';
const countDownTime = 5;
var timeLeft = 15;

var reactionCollector = null;

function resetGame() {
    lastRoll = 0;
    nextIndex = 0;
    timeLeft = countDownTime;
    playerQueue = [];
    gameStarted = false;
    waitingForPlayers = true;
    if (reactionCollector !== null) {
        reactionCollector.stop();
        reactionCollector = null;
    }
}

function killPlayer(message) {
    var player = playerQueue[nextIndex];
    player.eliminated = true;
    let loseMessage = `*${player.username}* was eliminated`;

    let gameFinished = playerQueue.filter(p => !p.eliminated).length === 1;
    let winMessage = gameFinished ? `\n**${playerQueue.find(p => !p.eliminated).username}** won!` : null;

    if (winMessage !== null) {
        message.clearReactions();
        gameStarted = false;
    }

    return (`\n${loseMessage}${winMessage}`);
}

function doRoll(message, playerId) {
    let playerIndex = playerQueue.findIndex(p => p.id === playerId);
    let player = playerQueue[playerIndex];
    if (player === null) {
        return;
    }

    if (playerIndex == nextIndex) {
        let roll = Math.floor(1 + (Math.random() * lastRoll));
        var killMessage = '';
        var rollFailed = false;
        if (roll == 1) {
            rollFailed = true;
            killMessage = killPlayer(message);
        }

        while (true) {
            nextIndex ++;
            if (nextIndex >= playerQueue.length) {
                nextIndex = 0;
            }

            if (!playerQueue[nextIndex].eliminated) {
                break;
            }
        }

        var resultMsg = getUserInfoList();
        resultMsg += '\n';
        resultMsg += `*${player.username}* rolled an **${roll}** out of **${lastRoll}**`;
        if (killMessage.length > 0) {
            resultMsg += killMessage;
        }

        if (!rollFailed) {
            lastRoll = roll;
        }

        message.edit(resultMsg)

        clearUserReactions(message);
    }
}

function clearUserReactions(message) {
    const filter = (reaction, user) => reaction.emoji.name === dice && !user.bot;
    var r = message.reactions.find(filter);
    if (r != null) {
        let users = r.users;
        let userArray = users.array();

        for (user of userArray) {
            if (user.id !== client.user.id) {
                r.remove(user);
            }
        }
    }
}

function startGame(message, userList) {
    message.clearReactions();

    for (user of userList) {
        user.eliminated = false;
    }

    if (userList.length <= 1) {
        message.edit('>>> Not enough users joined. Cancelling game.');
        message.clearReactions();
        resetGame();
        return;
    }

    let randomizedList = userList.sort(() => Math.random() - 0.5);
    playerQueue = randomizedList;
    gameStarted = true;
    waitingForPlayers = false;

    message.delete();
    printInfo(message);
}

function getUserInfoList() {
    const onlyOneAlive = playerQueue.filter(u => !u.eliminated).length == 1;
    let userOrder = playerQueue.map((u, index) => {
        let info = `**${index + 1}**: *${u.username}*`;
        if (index == nextIndex) {
            if (onlyOneAlive) {
                info = `__${info}__ :crown:`;
            }else {
                info = `__${info}__ :point_left:`;
            }
        }
        if (u.eliminated) {
            info = `~~${info}~~ :skull:`;
        }
        return info;
    }).join('\n');

    const title = 'Player Order:\n';

    return title + userOrder;
}

function printInfo(message) {
    const userOrder = getUserInfoList();

    message.channel.send(userOrder).then(msg => {
        msg.react(dice);
        // Create a reaction collector
        const filter = (reaction, user) => reaction.emoji.name === dice && !user.bot;
        reactionCollector = msg.createReactionCollector(filter);
        reactionCollector.on('collect', r => {
            let users = r.users;
            var nextId = playerQueue[nextIndex].id;
            if (users.get(nextId) != null) {
                doRoll(msg, nextId);
            }

            let userArray = users.array();

            for (user of userArray) {
                if (user.id !== client.user.id) {
                    r.remove(user);
                }
            }
        });
        reactionCollector.on('end', collected => console.log(`Collected ${collected.size} items`));
    })
}

function waitForPlayers(message) {
    timeLeft --;

    let collected = message.reactions;
    let reacts = collected.find(e => e.emoji.name === dice);
    let users = [];
    if (reacts != null) {
        users = reacts.users.filter(user => { return !user.bot; }).array();
    }

    if (users.length > playerQueue.length) {
        timeLeft += 1;
    }

    playerQueue = users;

    if (timeLeft <= 0) {
        startGame(message, users);
        return;
    }

    let title = 'Waiting for players, please click the reaction to join.\n';

    let userInfo = '';
    if (users.length > 0) {
        userInfo = 'Players:\n';
        userInfo += users.map((u, index) => `**${index + 1}**: *${u.username}*`).join('\n');
    }

    message.edit(`${title}${timeLeft} ${timeLeft > 1 ? 'seconds' : 'second'} left\n${userInfo}`).then(msg => {
        setTimeout(waitForPlayers, 1000, msg);
    })
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

    if (command === 'roll') {
        const playerIndex = playerQueue.findIndex(p => p.id === message.author.id);
        if (!gameStarted) {
            resetGame();
            const roll = parseInt(args[0], 10) || -1;
            if (roll == -1) {
                message.reply('To start the game, type `' + config.prefix + 'roll [roll amount]`')
                return;
            } else {
                lastRoll = roll;

                gameStarted = true;
                waitingForPlayers = true;
                message.channel.send(`>>> Playing a death roll for **${roll}**`)
                message.channel.send(':timer:').then(msg => {
                    msg.react(dice);
                    waitForPlayers(msg);
                });
                return;
            }
        }
    }
});

client.login(config.token);