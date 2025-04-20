const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const path = require('path');
const fs = require('fs');
const connection = require('./database/connect'); // Menggunakan koneksi dari file connect.js
const config = require('./config');
const { exit } = require('process');

// Fungsi untuk membaca file command dari folder
function getCommandFiles(dir) {
  let commandFiles = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      commandFiles = commandFiles.concat(getCommandFiles(fullPath));
    } else if (file.endsWith('.js')) {
      commandFiles.push(fullPath);
    }
  }

  return commandFiles;
}

// Fungsi untuk mengambil semua guild_id dari database (menggunakan Promise)
async function getAllGuildIds() {
  try {
    // Query database untuk mengambil guild_id dari tabel guild_settings
    const [rows] = await connection.query('SELECT guild_id FROM guild_settings');
    return rows.map(row => row.guild_id);
  } catch (error) {
    throw new Error('Gagal mengambil guild_id: ' + error.message);
  }
}

// Membaca semua file command dari folder commands
const commands = [];
const commandFiles = getCommandFiles(path.join(__dirname, 'commands'));

for (const file of commandFiles) {
  const command = require(file);
  if (command.data && command.data.toJSON) {
    commands.push(command.data.toJSON());
  }
}

// Menjalankan pendaftaran command aplikasi setelah mendapatkan guild_id dari database
(async () => {
  try {
    // Ambil semua guild_id yang terdaftar di database
    const guildIds = await getAllGuildIds();

    if (guildIds.length === 0) {
      console.log('Tidak ada guild yang terdaftar.');
      return;
    }

    // Daftarkan command ke masing-masing guild
    const rest = new REST({ version: '10' }).setToken(config.token); // Ganti dengan token bot Anda

    console.log('Memulai pendaftaran command aplikasi (/)');

    let successCount = 0;

    for (const guildId of guildIds) {
      try {
        await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), {
          body: commands,
        });
        console.log(`Sukses mendaftarkan command aplikasi (/) untuk guild ${guildId}`);
        successCount++;
      } catch (error) {
        console.error(`Error mendaftarkan command untuk guild ${guildId}:`, error);
      }
    }

    // Menampilkan total guild yang berhasil didaftarkan
    console.log(`Sukses mendaftarkan perintah pada ${successCount} guild`);
    exit(0); // Keluar dari proses dengan status 0 (sukses)
  } catch (error) {
    console.error('Error saat mendaftarkan command:', error);
  }
})();
