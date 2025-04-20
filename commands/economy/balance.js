const { SlashCommandBuilder } = require('discord.js');
const connection = require('../../database/connect'); // Pastikan koneksi database menggunakan mysql2/promise
const crypto = require('crypto');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Cek saldo akunmu'),
  
  async execute(interaction) {
    const userId = interaction.member.user.id;

    try {
      // Query the database to get the user's balance
      const [results] = await connection.query(
        'SELECT balance, wallet_address FROM users WHERE discord_id = ?',
        [userId]
      );

      if (results.length === 0) {
        // User does not have a wallet, create a new one
        const walletAddress = crypto.randomBytes(16).toString('hex');
        
        await connection.promise().query(
          'INSERT INTO users (discord_id, wallet_address, balance) VALUES (?, ?, ?)',
          [userId, walletAddress, 0]
        );
        
        return interaction.reply('Akun wallet berhasil dibuat! Gunakan `/balance` untuk mengecek saldo awalmu.');
      } else {
        // User already has a wallet, display the balance
        const { balance, wallet_address } = results[0];
        const username = interaction.member.user.username;
        
        return interaction.reply({
          content: `💳 **Kartu Rekening Virtual** 💳\n` +
                   '-----------------------------------\n' +
                   `👤 Nama Pemilik: **${username}**\n` +
                   `💰 Saldo: **${balance} coins**\n` +
                   `🏦 Alamat Wallet: **${wallet_address}**\n` +
                   '-----------------------------------\n' +
                   '✨ Terus tingkatkan saldo Anda dan jadilah yang terkaya! 💎',
          flags: 64, // Ephemeral flag to make the message visible only to the user
        });
      }
    } catch (error) {
      console.error('Error:', error);
      return interaction.reply('Terjadi kesalahan saat mengambil saldo.');
    }
  },
};
