// server.js
require('dotenv').config(); // Memastikan .env sudah dimuat
const config = require('./config'); // Pastikan path ke file config.js benar
const { Client, GatewayIntentBits } = require('discord.js');
const handleEvents = require('./functions/handlers/handleEvents'); // Memastikan jalur relatifnya benar

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

// Menambahkan konfigurasi ke objek client
client.config = config;

// Memanggil event handler setelah bot berhasil dibuat
handleEvents(client);

// Login ke Discord menggunakan token yang disimpan di .env
client.login(process.env.DISCORD_TOKEN);
