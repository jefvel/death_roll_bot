class WinLoseStats {
  constructor(game) {
    this.game = game;
    game.addEventListener('PLAYER_WON_ROLL', this.onPlayerWon);
    game.addEventListener('PLAYER_LOST_ROLL', this.onPlayerLost);
  }

  onPlayerWon = async (e) => {
    const { player, participants } = e;
    const user = await this.game.db.getUser(player.id);

    const { stats } = this.game;

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
    const { player, participants } = e;
    const user = await this.game.db.getUser(player.id);

    const { stats } = this.game;

    stats.updateStatIfHigher(
      stats.statsKeys.biggestWinStreak,
      user.win_streak,
      `:clap: Longest Win Streak`, `**${user.username}** won **${user.win_streak}** rolls in a row. A great champion!`,
    ).then(record => {
      if (record.changed) {
        stats.broadcastNewRecord(record.stat, e.channel);
      }
    });

    this.game.db.addLossToUser(player.id);
  }
}

module.exports = WinLoseStats;

