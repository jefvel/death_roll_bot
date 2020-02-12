const fs = require('fs');

const helpText = fs.readFileSync('./help.txt', 'utf-8');
function help({ message }) {
  message.author.send(helpText);
}

module.exports = help;
