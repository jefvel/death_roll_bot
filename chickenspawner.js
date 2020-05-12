function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class ChickenSpawner {
  constructor(discordClient, db, game) {
    this.client = discordClient;
    this.db = db;
    this.game = game;
  }

  async giveChickensToUser(user, channel, amount) {
    const { stats } = this.game;
    let msg = await channel.send(`But, something is happening! ${user.username}: :sweat:`);
    await timeout(2000);
    msg = await msg.edit(`But, something is happening! ${user.username}: :sick:`);
    await timeout(2000);

    let chickens = '';
    for (let i = 0; i < amount; i ++) {
      if (i > 30) {
        chickens += ` + **${amount - i}**`;
        break;
      }
      chickens = chickens + ':hatching_chick:';
    }

    this.db.giveChickensToUser(user.id, amount);


    await stats.updateStatIfHigher(
      stats.statsKeys.mostChickens, amount, `:hatching_chick: Most Chickens Puked`, `**${user.username}** puked the most chickens in one meal: **${amount}** chickens!`,
      channel,
    );

    const chickenMessage = `${user.username} puked up ${amount} chicken${amount>1?'s':''}! Please take care of them!`;
    msg = await msg.edit(`But, something is happening! ${user.username}: :face_vomiting: ${chickens}\n${chickenMessage}`);
  }
}

module.exports = ChickenSpawner;
