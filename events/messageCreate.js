const { handleCommands } = require('../functions/handlers/handleCommands');
const { verifyUser } = require('../utils/verifyStore');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    const verifyChannelId = client.config.verifyChannelId;
    if (message.channel.id === verifyChannelId) {
      verifyUser(client, message); // Verifikasi user di channel tertentu
    } else {
      handleCommands(client, message); // Menangani command biasa
    }
  }
};
