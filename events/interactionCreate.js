const { handleCommands } = require('../functions/handlers/handleCommands.js');
const { verifyUser } = require('../utils/verifyStore.js');
const { InteractionType } = require('discord.js');
const connection = require('../database/connect');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Pastikan interaksi adalah perintah slash
    
    if (interaction.user.bot) return; // Abaikan interaksi dari bot lain
    
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    
    // Ambil setting guild dari cache
    const guildSettings = client.guildConfigs.get(interaction.guild.id);
    if (!guildSettings) {
      return message.reply('⚠️ | Bot belum dikonfigurasi untuk server ini.');
    }
    const verifyChannelId = guildSettings.verify_channel_id;

    try {
      if (interaction.channel.id === verifyChannelId) {
        // Handle verification commands di channel yang spesifik
        await verifyUser(client, interaction);
      } else {
        // Handle command lainnya
        await handleCommands(client, interaction);
      }
    } catch (error) {
      console.error('❌ | Error handling interaction:', error);
      await interaction.reply({
        content: 'There was an error while executing this command.',
        flags: 64,
      });
    }
  },
};
