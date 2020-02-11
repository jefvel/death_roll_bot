function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class ChickenSpawner {
  constructor(discordClient, db) {
    this.client = discordClient;
    this.db = db;
  }

  async giveChickensToUser(user, channel, amount) {
    let msg = await channel.send(`But, something is happening! ${user.username}: :sweat:`);
    await timeout(2000);
    msg = await msg.edit(`But, something is happening! ${user.username}: :sick:`);
    await timeout(2000);

    let chickens = '';
    for (let i = 0; i < amount; i ++) {
      chickens = chickens + ':hatching_chick:';
    }

    const chickenMessage = `${user.username} puked up ${amount} chicken${amount>1?'s':''}! Please take care of them!`;

    msg = await msg.edit(`But, something is happening! ${user.username}: :face_vomiting: ${chickens}\n${chickenMessage}`);
    this.db.giveChickensToUser(user.id, amount);
  }
}

module.exports = ChickenSpawner;
