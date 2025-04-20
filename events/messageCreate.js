const { handleCommands } = require('../functions/handlers/handleCommands');
const { verifyUser } = require('../utils/verifyStore');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Ambil setting guild dari cache
    const guildSettings = client.guildConfigs.get(message.guild.id);

    if (!guildSettings) {
      return message.reply('⚠️ | Bot belum dikonfigurasi untuk server ini.');
    }

    const verifyChannelId = guildSettings.verify_channel_id;

    if (message.channel.id === verifyChannelId) {
      verifyUser(client, message); // Jalankan proses verifikasi
    } else {
      handleCommands(client, message); // Jalankan command
    }
  }
};
