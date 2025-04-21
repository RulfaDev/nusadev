const { SlashCommandBuilder } = require('discord.js');
const connection = require('../../database/connect');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reward')
    .setDescription('Klaim reward harian dari sistem supply'),

  async execute(interaction) {
    const userId = interaction.member.user.id;

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
      let rewardAmount = 0.0; // Default reward
      let messages = [];

      // 1% chance untuk dapat reward besar
      const luckyDraw = Math.random();
      if (luckyDraw <= 0.0005) { // 0.05% chance
        rewardAmount = 0.0001000000; // Reward sangat besar
        messages.push(`🎉 [Legendary] Selamat Kamu Sangat Beruntung Sekali!`);
      } else if (luckyDraw <= 0.005) { // 0.5% chance untuk reward besar
        rewardAmount = 0.0000100000; // Reward besar
        messages.push(`🎉 [Epic] Selamat Kamu Sangat Beruntung!`);
      } else if(luckyDraw <= 0.05) { // 5% chance untuk reward sedang
        rewardAmount = Number((Math.random() * (0.0000050000 - 0.0000010000) + 0.0000010000).toFixed(10));
        messages.push(`🎉 [Master] Selamat Kamu Begitu Berungtung!`);
      } else if(luckyDraw <= 0.10) { // 10% chance untuk reward kecil
        rewardAmount = Number((Math.random() * (0.0000050000 - 0.0000001000) + 0.0000001000).toFixed(10));
        messages.push(`🎉 [Elite] Selamat Kamu Beruntung! `);
      } else {
        // sisa untuk reward normal
        messages.push(`🎉 [Normal] Selamat!`);
        rewardAmount = Number((Math.random() * (0.0000010000 - 0.0000000100) + 0.0000000100).toFixed(10));
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

      const formattedReward = rewardAmount.toLocaleString('en-US', {
        minimumFractionDigits: 10,
        maximumFractionDigits: 10,
      });

      // Transaksi: kurangi supply, tambah user, log ke reward_logs
      await connection.query('START TRANSACTION');

      console.log(`Penambangan Suplai #${selectedSupply.id}:`, formattedReward);

      // Kurangi dari supply
      await connection.query(
        'UPDATE supplys SET balance = balance - ? WHERE id = ?',
        [formattedReward, selectedSupply.id]
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

      // Pesan utama klaim reward
      messages.push(`🎉 Kamu berhasil klaim **${formattedReward} coins** dari supply blcok #${selectedSupply.id}!\nCoba lagi besok untuk peluang lebih besar!`);

      // Gabungkan semua pesan jadi satu dan kirim
      return interaction.reply({
        content: messages.join('\n'),
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
