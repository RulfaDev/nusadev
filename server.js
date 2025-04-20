require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const handleEvents = require('./functions/handlers/handleEvents');
const db = require('./database/connect');

// Membuat objek client dengan intents yang diperlukan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ]
});

// Tambahkan properti tambahan ke client
client.config = config;
client.db = db;
client.guildConfigs = new Collection(); // Untuk menyimpan setting per-guild di cache

// Memanggil event handler setelah bot berhasil dibuat
handleEvents(client);

// Login ke Discord menggunakan token yang disimpan di .env
client.login(config.token);
