const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar perintah berdasarkan kategori'),

  async execute(interaction) {
    try {
      const commandsPath = path.join(__dirname, '..'); // Path ke folder commands
      const categories = fs.readdirSync(commandsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      let helpMessage = '📋 **Daftar Perintah**:\n\n';

      for (const category of categories) {
        helpMessage += `**${category.charAt(0).toUpperCase() + category.slice(1)}**:\n`;

        const categoryPath = path.join(commandsPath, category);
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
          const command = require(path.join(categoryPath, file));
          if (command.data && command.data.name && command.data.description) {
            helpMessage += `- \`/${command.data.name}\`: ${command.data.description}\n`;
          }
        }

        helpMessage += '\n';
      }

      await interaction.reply(helpMessage);
    } catch (error) {
      console.error('❌ Gagal menampilkan daftar perintah:', error);
      await interaction.reply({ content: '❌ Terjadi kesalahan saat menampilkan daftar perintah.', ephemeral: true });
    }
  }
};