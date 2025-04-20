const { SlashCommandBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ComponentType } = require('discord.js');
const connection = require('../../database/connect');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Pengaturan bot untuk server ini. Hanya untuk admin.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('verify')
        .setDescription('Menyiapkan channel untuk verifikasi pengguna.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reward')
        .setDescription('Menyiapkan pengaturan reward server.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('role')
        .setDescription('Menyiapkan role yang diberikan setelah verifikasi berhasil.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options?.getSubcommand?.() || null;
    const guildId = interaction.guild.id;
    const client = interaction.client; // Mengambil client dari interaction

    // Cek permission
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Kamu tidak memiliki izin untuk menjalankan perintah ini.',
        flags: 64,
      });
    }

    if (!subcommand) {
      return interaction.reply({
        content:
          '🔧 Berikut adalah daftar setup yang tersedia:\n\n' +
          '**/setup verify** - Menyiapkan channel untuk verifikasi pengguna.\n' +
          '**/setup reward** - Menyiapkan pengaturan reward server.',
        flags: 64,
      });
    }

    try {
      // Cek jika pengaturan guild sudah ada di cache
      let guildSettings = client.guildConfigs.get(guildId);

      // Jika belum ada di cache, ambil dari database dan simpan ke cache
      if (!guildSettings) {
        const [settings] = await connection.query(
          'SELECT * FROM guild_settings WHERE guild_id = ?',
          [guildId]
        );

        if (settings.length > 0) {
          guildSettings = settings[0];
          client.guildConfigs.set(guildId, guildSettings); // Menyimpan ke cache
        }
      }

      if (subcommand === 'verify') {
        const channelSelect = new ChannelSelectMenuBuilder()
          .setCustomId('select-verify-channel')
          .setPlaceholder('Pilih channel untuk verifikasi')
          .addChannelTypes(0); // 0 = GUILD_TEXT (text channel)

        const row = new ActionRowBuilder().addComponents(channelSelect);

        await interaction.reply({
          content: '🔧 Silakan pilih channel yang akan digunakan untuk verifikasi:',
          components: [row],
          flags: 64,
        });

        const collector = interaction.channel.createMessageComponentCollector({
          componentType: ComponentType.ChannelSelect,
          time: 30000,
        });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Kamu tidak bisa menggunakan menu ini.', flags: 64 });
          }

          const selectedChannel = i.values[0]; // Channel ID

          await connection.query(
            'UPDATE guild_settings SET verify_channel_id = ? WHERE guild_id = ?',
            [selectedChannel, guildId]
          );

          // Update cache setelah menyimpan ke database
          guildSettings.verify_channel_id = selectedChannel;
          client.guildConfigs.set(guildId, guildSettings); // Update cache

          await i.update({
            content: `✅ Channel verifikasi telah diatur ke <#${selectedChannel}>.`,
            components: [],
          });

          collector.stop();
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            await interaction.editReply({
              content: '❌ Waktu habis. Kamu tidak memilih channel.',
              components: [],
            });

            setTimeout(async () => {
              await interaction.deleteReply().catch(console.error);
            }, 5000);
          }
        });
      }

      if (subcommand === 'role') {
        const roleSelect = new RoleSelectMenuBuilder()
          .setCustomId('select-verification-role')
          .setPlaceholder('Pilih role yang diberikan setelah verifikasi')
          .setMinValues(1)
          .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(roleSelect);

        await interaction.reply({
          content: '🔧 Silakan pilih role yang akan diberikan setelah verifikasi:',
          components: [row],
          flags: 64,
        });

        const collector = interaction.channel.createMessageComponentCollector({
          componentType: ComponentType.RoleSelect,
          time: 30000,
        });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Kamu tidak bisa menggunakan menu ini.', flags: 64 });
          }

          const selectedRole = i.values[0]; // Role ID
          const roleName = i.guild.roles.cache.get(selectedRole).name; // Mendapatkan nama role berdasarkan ID

          await connection.query(
            'UPDATE guild_settings SET verified_role_name = ? WHERE guild_id = ?',
            [roleName, guildId]
          );

          // Update cache setelah menyimpan ke database
          guildSettings.verified_role_name = roleName;
          client.guildConfigs.set(guildId, guildSettings); // Update cache

          await i.update({
            content: `✅ Role verifikasi telah diatur ke **${roleName}**.`,
            components: [],
          });

          collector.stop();
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            await interaction.editReply({
              content: '❌ Waktu habis. Kamu tidak memilih role.',
              components: [],
            });

            setTimeout(async () => {
              await interaction.deleteReply().catch(console.error);
            }, 5000);
          }
        });
      }

      if (subcommand === 'reward') {
        return interaction.reply({
          content: '🔧 Pengaturan reward sedang dalam pengembangan.',
          flags: 64,
        });
      }

    } catch (error) {
      console.error('Error saat setup bot:', error);

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: '❌ Terjadi kesalahan saat mengonfigurasi bot.',
          flags: 64,
        });
      } else {
        return interaction.reply({
          content: '❌ Terjadi kesalahan saat mengonfigurasi bot.',
          flags: 64,
        });
      }
    }
  },
};
