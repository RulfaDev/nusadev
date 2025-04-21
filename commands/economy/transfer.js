const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const connection = require('../../database/connect');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer saldo ke pengguna lain')
    .addStringOption(option =>
      option.setName('wallet_address')
        .setDescription('Alamat wallet pengguna yang ingin dikirim saldo')
        .setRequired(true)),

  async execute(interaction) {
    const pajak = 0.001; // 0.1% fee

    const walletAddress = interaction.options?.getString('wallet_address') || interaction.content.slice('!transfer'.length).trim().split(' ')[0];
    if (!walletAddress) {
        return interaction.reply({ content: 'Silakan masukkan alamat wallet yang valid.', flags: 64 });
    }
    const senderId = interaction.user?.id || interaction.member.user.id;

    // Ambil saldo pengirim berdasarkan discord_id
    const [senderResult] = await connection.query(
      'SELECT id, balance, wallet_address FROM users WHERE discord_id = ?',
      [senderId]
    );

    if (senderResult.length === 0) {
      return interaction.reply({ content: 'Akun wallet kamu belum ada.', flags: 64 });
    }

    const senderBalance = parseFloat(senderResult[0].balance);
    const senderWallet = senderResult[0].wallet_address;

    // Pastikan wallet address pengirim bukan sama dengan wallet address penerima
    if (senderWallet === walletAddress) {
      return interaction.reply({ content: 'Kamu tidak bisa mentransfer ke alamat wallet kamu sendiri.', flags: 64 });
    }

    // Tampilkan modal untuk input jumlah transfer
    const modal = new ModalBuilder()
      .setCustomId(`transfer_modal_${walletAddress}`)
      .setTitle('Konfirmasi Transfer');

    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('Masukkan jumlah yang ingin ditransfer')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Contoh: 0.00010');

    const row = new ActionRowBuilder().addComponents(amountInput);
    modal.addComponents(row);

    if (interaction.commandName) {
      await interaction.showModal(modal);
    } else if (interaction.content.startsWith('!transfer') && interaction.content.slice('!transfer'.length).trim().split(' ')[0]) {
       interaction.reply({ content: 'Masukkan jumlah yang ingin kamu transfer (Jumlah minimal transfer adalah 0.00010 coins):', flags: 64 });
        const filter = m => m.author.id === senderId;
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });
        collector.on('collect', async (m) => {
        const amount = parseFloat(m.content);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply('Jumlah tidak valid.');
            }

            interaction.reply(`Transfer ${amount} ke ${walletAddress} akan diproses...`);

            if (isNaN(amount) || amount < 0.0001) {
                return interaction.reply({ content: 'Jumlah minimal transfer adalah 0.00010 coins.', flags: 64 });
            }

            if (amount > senderBalance) {
                return interaction.reply({ content: 'Saldo kamu tidak mencukupi untuk transfer.', flags: 64 });
            }

            // Hitung fee dan net amount
            const fee = parseFloat((amount * pajak).toFixed(20));
            const netAmount = parseFloat((amount - fee).toFixed(20));

            try {
                // Update saldo pengirim
                await connection.query(
                'UPDATE users SET balance = balance - ? WHERE discord_id = ?',
                [amount, senderId]
                );

                // Pastikan penerima punya akun dengan wallet_address
                const [receiverResult] = await connection.query(
                'SELECT id, balance, wallet_address FROM users WHERE wallet_address = ?',
                [walletAddress]
                );

                if (receiverResult.length === 0) {
                return interaction.reply({ content: 'Alamat wallet tujuan tidak ditemukan.', flags: 64 });
                }

                // Update saldo penerima
                await connection.query(
                'UPDATE users SET balance = balance + ? WHERE wallet_address = ?',
                [netAmount, walletAddress]
                );

                // Ambil salah satu ID supply secara acak
                const [supplyResults] = await connection.query('SELECT id FROM supplys ORDER BY RAND() LIMIT 1');
                const supplyId = supplyResults[0].id;

                // Tambahkan fee ke salah satu akun supply
                await connection.query(
                'UPDATE supplys SET balance = balance + ? WHERE id = ?',
                [fee, supplyId]
                );

                // Simpan log transfer ke tabel transfer_logs
                await connection.query(
                'INSERT INTO transfer_logs (form_user_id, to_user_id, amount, created_at) VALUES (?, ?, ?, ?)',
                [senderResult[0].id, receiverResult[0].id, amount, new Date()]
                );

                return interaction.reply({
                content: `✅ Transfer berhasil! Kamu mengirim **${netAmount} coins** ke alamat wallet ${walletAddress} (Biaya: ${fee} coins, masuk ke supply block #${supplyId}).`,
                flags: 64
                });

            } catch (err) {
                console.error(err);
                return interaction.reply({ content: 'Terjadi kesalahan saat memproses transfer.', flags: 64 });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.reply('Waktu habis, transfer dibatalkan.');
            }
        });
    }

    // Tangani modal
    const filter = (i) => i.customId === `transfer_modal_${walletAddress}` && i.user.id === senderId;
    interaction.client.once('interactionCreate', async (modalInteraction) => {
      if (!filter(modalInteraction)) return;

      const amount = parseFloat(modalInteraction.fields.getTextInputValue('amount'));
      if (isNaN(amount) || amount < 0.0001) {
        return modalInteraction.reply({ content: 'Jumlah minimal transfer adalah 0.00010 coins.', flags: 64 });
      }

      if (amount > senderBalance) {
        return modalInteraction.reply({ content: 'Saldo kamu tidak mencukupi untuk transfer.', flags: 64 });
      }

      // Hitung fee dan net amount
      const fee = parseFloat((amount * pajak).toFixed(20));
      const netAmount = parseFloat((amount - fee).toFixed(20));

      try {
        // Update saldo pengirim
        await connection.query(
          'UPDATE users SET balance = balance - ? WHERE discord_id = ?',
          [amount, senderId]
        );

        // Pastikan penerima punya akun dengan wallet_address
        const [receiverResult] = await connection.query(
          'SELECT id, balance, wallet_address FROM users WHERE wallet_address = ?',
          [walletAddress]
        );

        if (receiverResult.length === 0) {
          return modalInteraction.reply({ content: 'Alamat wallet tujuan tidak ditemukan.', flags: 64 });
        }

        // Update saldo penerima
        await connection.query(
          'UPDATE users SET balance = balance + ? WHERE wallet_address = ?',
          [netAmount, walletAddress]
        );

        // Ambil salah satu ID supply secara acak
        const [supplyResults] = await connection.query('SELECT id FROM supplys ORDER BY RAND() LIMIT 1');
        const supplyId = supplyResults[0].id;

        // Tambahkan fee ke salah satu akun supply
        await connection.query(
          'UPDATE supplys SET balance = balance + ? WHERE id = ?',
          [fee, supplyId]
        );

        // Simpan log transfer ke tabel transfer_logs
        await connection.query(
          'INSERT INTO transfer_logs (form_user_id, to_user_id, amount, created_at) VALUES (?, ?, ?, ?)',
          [senderResult[0].id, receiverResult[0].id, amount, new Date()]
        );

        return modalInteraction.reply({
          content: `✅ Transfer berhasil! Kamu mengirim **${netAmount} coins** ke alamat wallet ${walletAddress} (Biaya: ${fee} coins, masuk ke supply ID #${supplyId}).`,
          flags: 64
        });

      } catch (err) {
        console.error(err);
        return modalInteraction.reply({ content: 'Terjadi kesalahan saat memproses transfer.', flags: 64 });
      }
    });
  },
};
