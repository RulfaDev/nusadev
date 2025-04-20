const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek koneksi bot'),

  async execute(interaction) {
    try {
      await interaction.reply(`🏓 Pong! Latensi: ${interaction.client.ws.ping}ms`);
    } catch (error) {
      console.error('❌ Gagal membalas command ping:', error);
      await interaction.reply({ content: '❌ Terjadi kesalahan saat menjalankan command.', ephemeral: true });
    }
  }
};