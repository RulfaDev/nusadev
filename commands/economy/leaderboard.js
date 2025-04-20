const { SlashCommandBuilder } = require('discord.js');
const connection = require('../../database/connect');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat 10 pengguna dengan saldo tertinggi!'),

  async execute(interaction) {
    try {
      const [results] = await connection.query(
        'SELECT discord_id, balance FROM users ORDER BY balance DESC LIMIT 10'
      );

      if (results.length === 0) {
        return interaction.reply({
          content: '❌ Belum ada pengguna dengan saldo.',
          flags: 64,
        });
      }

      const guild = interaction.guild;

      let leaderboardText = results.map((row, index) => {
        const member = guild.members.cache.get(row.discord_id);
        const tag = member ? member.user.tag : `User ID: ${row.discord_id}`;
        return `**${index + 1}.** ${tag} — 💰 ${row.balance} coins`;
      }).join('\n');

    await interaction.reply({
        embeds: [{
            title: '🏆 Leaderboard Ekonomi',
            description: leaderboardText,
            color: 0xFFD700,
            timestamp: new Date(),
            footer: {
            text: 'Top 10 Pengguna dengan Saldo Tertinggi',
            },
        }],
    });

    const reply = await interaction.fetchReply();

    setTimeout(() => {
        reply.delete().catch(console.error);
    }, 30000);

    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Terjadi kesalahan saat mengambil leaderboard.',
        flags: 64,
      });
    }
  },
};
