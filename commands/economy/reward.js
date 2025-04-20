const { SlashCommandBuilder } = require('discord.js');
const connection = require('../../database/connect');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reward')
    .setDescription('Klaim reward harian dari sistem supply'),

  async execute(interaction) {
    const userId = interaction.user.id;

    try {
      // Cek apakah user sudah memiliki wallet
      const [userRows] = await connection.query(
        'SELECT id, balance FROM users WHERE discord_id = ?',
        [userId]
      );

      if (userRows.length === 0) {
        return interaction.reply({
          content: '❌ Kamu belum memiliki akun wallet.\n💡 Gunakan `/balance` untuk membuat wallet terlebih dahulu.',
          flags: 64,
        });
      }

      // Ambil user_id yang terkait dengan discord_id
      const userIdFromDB = userRows[0].id;

      // Cek apakah user sudah klaim reward dalam 24 jam terakhir
      const [rewardLogRows] = await connection.query(
        'SELECT last_claimed_at FROM reward_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userIdFromDB]
      );

      const currentTime = new Date();
      if (rewardLogRows.length > 0) {
        const lastClaimed = new Date(rewardLogRows[0].last_claimed_at);
        const timeDifference = currentTime - lastClaimed;

        // Jika kurang dari 24 jam (86400000 ms), tidak boleh klaim lagi
        if (timeDifference < 86400000) {
          const remainingTime = 86400000 - timeDifference;
          const hours = Math.floor(remainingTime / 3600000);
          const minutes = Math.floor((remainingTime % 3600000) / 60000);
          return interaction.reply({
            content: `❌ Kamu sudah klaim reward hari ini. Cobalah lagi dalam ${hours} jam ${minutes} menit.`,
            flags: 64,
          });
        }
      }


      // Tentukan jumlah reward
      let rewardAmount = 0.00010;

      // 1% chance untuk dapat reward besar
      const luckyDraw = Math.random();
      if (luckyDraw <= 0.01) {
        // Random reward antara 0.00010 sampai 0.00100
        rewardAmount = parseFloat((Math.random() * (0.00100 - 0.00010) + 0.00010).toFixed(5));
      }

      // Cari supply yang mencukupi
      const [supplyRows] = await connection.query(
        'SELECT id, balance FROM supplys WHERE balance >= ? ORDER BY id ASC',
        [rewardAmount]
      );

      if (supplyRows.length === 0) {
        return interaction.reply({
          content: '❌ Supply sudah habis. Tidak dapat mengklaim reward sekarang.',
          flags: 64,
        });
      }

      const selectedSupply = supplyRows[0];

      // Transaksi: kurangi supply, tambah user, log ke reward_logs
      await connection.query('START TRANSACTION');

      // Kurangi dari supply
      await connection.query(
        'UPDATE supplys SET balance = balance - ? WHERE id = ?',
        [rewardAmount, selectedSupply.id]
      );

      // Tambah ke user
      await connection.query(
        'UPDATE users SET balance = balance + ? WHERE discord_id = ?',
        [rewardAmount, userId]
      );

      // Log ke reward_logs dengan user_id yang sesuai dan update last_claimed_at
      await connection.query(
        'INSERT INTO reward_logs (user_id, amount, supply_id, created_at, last_claimed_at) VALUES (?, ?, ?, NOW(), NOW())',
        [userIdFromDB, rewardAmount, selectedSupply.id]
      );
      
      await connection.query('COMMIT');

      return interaction.reply({
        content: `🎉 Kamu berhasil klaim **${rewardAmount} coins** dari supply #${selectedSupply.id}!\nCoba lagi besok untuk peluang lebih besar!`,
        flags: 64,
      });

    } catch (error) {
      await connection.query('ROLLBACK');
      console.error('❌ Error saat klaim reward:', error);
      return interaction.reply({
        content: '❌ Terjadi kesalahan saat klaim reward. Silakan coba lagi nanti.',
        flags: 64,
      });
    }
  },
};
