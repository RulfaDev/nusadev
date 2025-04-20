// events/interactionCreate.js
const { handleCommands } = require('../functions/handlers/handleCommands.js');
const { verifyUser } = require('../utils/verifyStore.js');
const { InteractionType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Pastikan interaksi adalah perintah slash
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const verifyChannelId = client.config.verifyChannelId;

    try {
      if (interaction.channel.id === verifyChannelId) {
        // Handle verification commands di channel yang spesifik
        await verifyUser(client, interaction);
      } else {
        // Handle command lainnya
        await handleCommands(client, interaction);
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    }
  },
};
