const { ActivityType } = require('discord.js');
const db = require('../database/connect'); // pastikan path sesuai
const { getGuildSettings } = require('../utils/guildSettings'); // fungsi opsional untuk ambil satuan

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ | Bot aktif sebagai ${client.user.tag}`);
    client.user.setActivity('Ketik verifikasi', { type: ActivityType.Watching });

    // Inisialisasi map untuk cache config per server
    client.guildConfigs = new Map();
    client.guildConfigs.clear();

    try {
      const [rows] = await db.query('SELECT * FROM guild_settings');

      rows.forEach((row) => {
        client.guildConfigs.set(row.guild_id, row); // Cache data berdasarkan guild_id
      });

      console.log(`🔧 | Loaded ${rows.length} guild setting(s) into cache.`);
    } catch (err) {
      console.error('❌ | Gagal load pengaturan guild dari database:', err);
    }
  },
};
