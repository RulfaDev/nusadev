const db = require('../database/connect');

async function saveDefaultGuildSettings(guildId) {
  const defaultSettings = {
    guild_id: guildId,
    prefix: '!',
    verify_channel_id: null,
    verified_role_name: null,
    created_at: new Date(),
  };

  await db.query('INSERT INTO guild_settings SET ?', [defaultSettings]);
  return defaultSettings;
}

async function getGuildSettings(guildId) {
  const [rows] = await db.query('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
  return rows[0] || null;
}

module.exports = {
  saveDefaultGuildSettings,
  getGuildSettings,
};
