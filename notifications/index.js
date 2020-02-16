const TownNotifications = require('./townnotifications');
const WinLoseStats = require('./winlosestats');

function init(game) {
  TownNotifications.init(game);
  new WinLoseStats(game);
}

module.exports = {
  init,
}
