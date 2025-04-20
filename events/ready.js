const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true, // dijalankan hanya sekali saat bot siap
  async execute(client) {
    console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
    client.user.setActivity('Ketik verifikasi', { type: ActivityType.Watching });
  }
};
