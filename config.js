require('dotenv').config(); // Pastikan dotenv dimuat agar .env bisa dibaca

module.exports = {
  token: process.env.DISCORD_TOKEN, // Token bot
  clientId: process.env.CLIENT_ID,  // Client ID bot
  database: {
    host: process.env.DB_HOST,      // Host database
    user: process.env.DB_USER,      // User DB
    password: process.env.DB_PASS,  // Password DB
    database: process.env.DB_NAME   // Nama DB
  },
};
