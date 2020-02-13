
class FormPrompt {
  constructor(user, game) {
    this.game = game;
    this.user = user;
    this.game.addEventListener('DIRECT_MESSAGE', this._msg);
    this._refreshTimeout();
  }

  _refreshTimeout() {
    this._clearTimeout();
    this._timeout = setTimeout(this.onTimeout.bind(this), 60000);
  }

  _clearTimeout() {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this._timeout = null;
  }

  _msg = (e) => {
    if (e.message.author.id === this.user.id) {
      this._refreshTimeout();
      this.onMessage(e.message);
    }
  }

  onMessage(message) {
  }

  async sendMessage(msg) {
    return this.user.send(msg);
  }

  onTimeout() {
    this.sendMessage('*Questions timed out. See you next time!*');
    this.close();
  }

  close() {
    this._clearTimeout();
    this.game.removeEventListener('DIRECT_MESSAGE', this._msg);
  }
}

module.exports = FormPrompt;
