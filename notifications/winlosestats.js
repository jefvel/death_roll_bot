class WinLoseStats {
  constructor(game) {
    this.game = game;
    game.addEventListener('PLAYER_WON_ROLL', this.onPlayerWon);
    game.addEventListener('PLAYER_LOST_ROLL', this.onPlayerLost);
  }

  onPlayerWon = async (e) => {
    const { game, player, participants } = e;
    const user = await this.game.db.getUser(player.id);

    const { stats } = this.game;

    game.db.incrementExp(player.id, e.wonEggs * game.constants.exp_per_win * Math.pow(game.constants.exp_win_multiplier, participants.length - 1));

    stats.updateStatIfHigher(
      stats.statsKeys.biggestLoseStreak,
      user.lose_streak,
      `:man_facepalming: Longest Lose Streak`, `**${user.username}** lost **${user.lose_streak}** rolls in a row!`,
    ).then(record => {
      if (record.changed) {
        stats.broadcastNewRecord(record.stat, e.channel);
      }
    });

    this.game.db.addWinToUser(player.id, participants.length - 1);
  }

  onPlayerLost = async (e) => {
    const { room, game, player, participants } = e;
    const user = await this.game.db.getUser(player.id);

    const { stats } = this.game;

    game.db.incrementExp(player.id, e.lostEggs * game.constants.exp_per_loss * Math.pow(game.constants.exp_win_multiplier, participants.length - 1));

    stats.updateStatIfHigher(
      stats.statsKeys.biggestWinStreak,
      user.win_streak,
      `:clap: Longest Win Streak`, `**${user.username}** won **${user.win_streak}** rolls in a row. A great champion!`,
    ).then(record => {
      if (record.changed) {
        stats.broadcastNewRecord(record.stat, e.channel);
      }
    });

    if (user.currency === 0 && room.bet > 0) {
      const res = await game.items.giveItemToUser(e.user, {
        price: 0,
        name: 'Gamblers Anonymous Membership',
        description: 'For those who have bet all what they have, and lost',
        avatar_url: 'https://media.discordapp.net/attachments/668497531742978100/681152647738163235/unknown.png',
        emoji: ':card_index:',
      }, true);
    }

    this.game.db.addLossToUser(player.id);
  }
}

module.exports = WinLoseStats;

