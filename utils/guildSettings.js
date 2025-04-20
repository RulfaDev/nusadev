const db = require('../database/connect');

async function getGuildSettings(guildId) {
  const [rows] = await db.query('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
  return rows[0] || null;
}

module.exports = { getGuildSettings };