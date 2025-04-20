const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Function to recursively read command files
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
const commandFiles = getCommandFiles(path.join(__dirname, 'commands'));

for (const file of commandFiles) {
  const command = require(file);
  if (command.data && command.data.toJSON) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
  try {
    console.log('Memulai pendaftaran command aplikasi (/)');

    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: commands,
    });

    console.log('Sukses mendaftarkan command aplikasi (/)');
  } catch (error) {
    console.error(error);
  }
})();
