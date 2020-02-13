async function playerJoined(event) {
  const { game, town, player } = event;

  const embed = {
    "title": `**${player.username}** joined the town!`,
    "description": `**${ town.name }** grows bigger once again!`,
    "color": 14942427,
    "thumbnail": {
      "url": game.constants.avatars.join,
    },
  };

  town.channel.send({ embed });
}

function init(game) {

  game.addEventListener('PLAYER_JOINED_TOWN', playerJoined);

}

module.exports = {
  init,
}
