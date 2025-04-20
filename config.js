require('dotenv').config(); // Pastikan dotenv dimuat agar .env bisa dibaca

module.exports = {
  token: process.env.DISCORD_TOKEN, // Token bot
  clientId: process.env.CLIENT_ID,  // Client ID bot
  guildId: process.env.GUILD_ID,  // ID server Discord
  database: {
    host: process.env.DB_HOST,      // Host database
    user: process.env.DB_USER,      // User DB
    password: process.env.DB_PASS,  // Password DB
    database: process.env.DB_NAME   // Nama DB
  },
  verifyChannelId: process.env.VERIFY_CHANNEL_ID,  // ID channel untuk verifikasi
  verifiedRoleName: process.env.VERIFIED_ROLE_NAME, // Nama role yang diberikan setelah verifikasi
  prefix: '!', // Prefix untuk command bot
};
