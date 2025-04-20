const fs = require('fs');
const path = require('path');
const { InteractionType } = require('discord.js');

module.exports.handleCommands = (client, message) => {
  const prefix = client.config.prefix;
  // Check if it's an interaction (slash command)
  if (message.type === InteractionType.ApplicationCommand) {
      // Pastikan yang dikirim adalah perintah berbasis interaksi
      const commandName = message.commandName;

      const commandsDir = path.join(__dirname, '../../commands');
      const folders = fs.readdirSync(commandsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      let commandFound = false;

      for (const foldername of folders) {
        const commandPath = path.join(commandsDir, foldername, `${commandName}.js`);
        if (fs.existsSync(commandPath)) {
          try {
            const command = require(commandPath); // Import file command

            // Jalankan command
            if (typeof command.execute === 'function') {
              command.execute(message, message.options, client);
            } else {
              message.reply({
                content: '❌ Command tidak memiliki fungsi `execute`.',
                ephemeral: true,
              });
            }
            commandFound = true;
          } catch (error) {
            console.error(`❌ Error pada command ${commandName}:`, error);
            message.reply({
              content: '❌ Terjadi kesalahan saat menjalankan command.',
              ephemeral: true,
            });
          }
          break;
        }
      }

      if (!commandFound) {
        message.reply({
          content: '❌ Command tidak dikenal!',
          ephemeral: true,
        });
      }
  }
  // Check if it's a message with prefix
  else if (message.content.startsWith(prefix)) {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const commandsDir = path.join(__dirname, '../../commands');
  const folders = fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of folders) {
    const commandPath = path.join(commandsDir, folder, `${commandName}.js`);
    if (fs.existsSync(commandPath)) {
      try {
        const command = require(commandPath);
        if (typeof command.execute === 'function') {
          command.execute(message, args, client);
        } else {
          message.reply('❌ Command tidak memiliki fungsi `execute`.');
        }
      } catch (error) {
        console.error(`❌ Error pada command ${commandName}:`, error);
        message.reply('❌ Terjadi kesalahan saat menjalankan command.');
      }
      return;
    }
  }

  message.reply('❌ Command tidak dikenal!');

  }
};
