const connection = require('../database/connect');

module.exports = {
  name: 'guildDelete',
  async execute(guild, client) {
    try {
      const guildId = guild.id;

      // Hapus dari database
      await connection.query('DELETE FROM guild_settings WHERE guild_id = ?', [guildId]);

      // Hapus dari cache
      client.guildConfigs.delete(guildId);

      console.log(`🗑️ | Data guild ${guild.name} (${guild.id}) berhasil dihapus dari database dan cache.`);
    } catch (err) {
      console.error(`❌ | Gagal menghapus data guild ${guild.id}:`, err);
    }
  }
};