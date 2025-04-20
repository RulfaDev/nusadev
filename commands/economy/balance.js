const { SlashCommandBuilder } = require('discord.js');
const connection = require('../../database/connect');
const crypto = require('crypto');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Cek saldo akunmu'),
  async execute(interaction) {
    const userId = interaction.member.user.id;

    // Query the database to get the user's balance
    connection.query(
      'SELECT balance, wallet_address FROM users WHERE discord_id = ?',
      [userId],
      (error, results) => {
        if (error) {
          console.error('Error fetching balance:', error);
          return interaction.reply('Terjadi kesalahan saat mengambil saldo.');
        }

        if (results.length === 0) {
          // User does not have a wallet, create a new one
          const walletAddress = crypto.randomBytes(16).toString('hex');
          connection.query(
            'INSERT INTO users (discord_id, wallet_address, balance) VALUES (?, ?, ?)',
            [userId, walletAddress, 0],
            (insertErr) => {
              if (insertErr) {
                console.error('Error creating wallet:', insertErr);
                return interaction.reply('Terjadi kesalahan saat membuat akun wallet.');
              }
              return interaction.reply('Akun wallet berhasil dibuat! Gunakan `/balance` untuk mengecek saldo awalmu.');
            }
          );
        } else {
          // User already has a wallet, display the balance
          const { balance, wallet_address } = results[0];
          const username = interaction.member.user.username;
          return interaction.reply({
            content: '💳 **Kartu Rekening Virtual** 💳\n' +
              '-----------------------------------\n' +
              `👤 Nama Pemilik: **${username}**\n` +
              `💰 Saldo: **${balance} coins**\n` +
              `🏦 Alamat Wallet: **${wallet_address}**\n` +
              '-----------------------------------\n' +
              '✨ Terus tingkatkan saldo Anda dan jadilah yang terkaya! 💎',
            ephemeral: true // Hanya terlihat oleh pengguna
          });
        }
      }
    );
  },
};
