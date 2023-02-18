const FormPrompt = require('../formprompt');

class ConfigPrompt extends FormPrompt {
  constructor(user, game, message) {
    super(user, game);
    this.message = message;
    this.currentStep = 0;
    this.guild = message.channel.guild;

    this.onInit();
  }

  onInit() {
    this.sendMessage(`What's up! It is very cool that you want to create a Town in the server **${this.guild.name}**!\n-----------\n`);

    const channelList = [];

    this.guild.channels.forEach(chan => {
      if (chan.type === 'text') {
        channelList.push(chan);
      }
    });

    this.channelList = channelList;

    if (channelList.length === 0) {
      this.sendMessage('It seems like your server has no text channels! Please create one first. See ya later!');
      this.close();
      return;
    }

    this.sendMessage('First off, you need to choose the game channel.\n');
    this.sendMessage(channelList.map((c, i) => `\`${i+1}\`. **${c.name}**`).join('\n') + '\n');
    this.sendMessage('Type in the number of the channel name you want to use.');
  }

  onMessage(msg) {
    switch (this.currentStep) {
      case 0:
        this.selectChannel(msg);
        return;
    }
  }

  selectChannel(msg) {
    const index = parseInt(msg.content);
    const channels = this.channelList;
    if (isNaN(index) || index < 1 || index > channels.length) {
      this.sendMessage(`Please enter a number between **1** and **${channels.length}**`);
      return;
    }

    this.selectedChannel = channels[index - 1];

    this.sendMessage(`Okay. The town channel will be **${this.selectedChannel.name}**. Type \`yes\` to confirm, and found the town!`);
    this.currentStep = 1;
  }

  /*
  async confirmCreate(msg) {
    if (msg.content !== 'yes') {
      this.sendMessage('All right. Skipping town founding for now.');
      this.close();
      return;
    }

    this.close();

    let town = null;

    try {
      town = await this.game.towns.createTown(this.guild.id, this.selectedChannel.id, this.guild.name);
    } catch(err) {
      this.sendMessage(`Sorry, could not found town. The reason is **${err}**`);
      return;
    }

    //this.sendMessage(`Very cool! The town **${this.guild.name}** has been founded! People can now join it by typing \`d.join\` on the server.`);
    this.sendMessage('Very cool, it is all set up!');
  }
  */
}

function config({ game, message }) {
  const { towns } = game;
  const { member } = message;

  if (!member) {
    message.reply('This command only works in server text channels');
    return;
  }

  if (!member.hasPermission("ADMINISTRATOR")) {
    message.author.send('You need server admin permissions to run this command');
    return;
  }

  new ConfigPrompt(message.author, game, message);

}

module.exports = config;
