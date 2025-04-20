const { saveDefaultGuildSettings } = require('../utils/guildSettings');
const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const path = require('path');
const fs = require('fs');
const config = require('../config');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    try {
      const existing = await client.guildConfigs.get(guild.id);

      if (!existing) {
        const saved = await saveDefaultGuildSettings(guild.id);
        client.guildConfigs.set(guild.id, saved); // Tambahkan ke cache juga
        console.log(`📦 | Default config saved for new guild: ${guild.name}`);
      }

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

      // Membaca semua file command dari folder commands
      const commands = [];
      const commandFiles = getCommandFiles(path.join(__dirname, '../commands'));

      for (const file of commandFiles) {
        const command = require(file);
        if (command.data && command.data.toJSON) {
          commands.push(command.data.toJSON());
        }
      }

      const rest = new REST({ version: '10' }).setToken(config.token); // Ganti dengan token bot Anda
      (async () => {
      try {
        console.log('🔧 | Memulai pendaftaran command aplikasi (/)');

        await rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), {
          body: commands,
        });

        console.log('✅ | Sukses mendaftarkan command aplikasi (/)');
      } catch (error) {
        console.error(error);
      }
    })();
    } catch (err) {
      console.error('❌ | Gagal menyimpan pengaturan default:', err);
    }
  },
};
