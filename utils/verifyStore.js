const { getGuildSettings } = require('../utils/guildSettings');
const fs = require('fs');
const path = require('path');

const captchaDataFilePath = path.join(__dirname, '../captcha/data.json');

let replyMessage; // Variabel global untuk menyimpan pesan balasan

// Fungsi untuk membaca data verifikasi dari file
function readCaptchaData() {
  if (!fs.existsSync(captchaDataFilePath)) {
    fs.writeFileSync(captchaDataFilePath, JSON.stringify({}));
  }
  const data = fs.readFileSync(captchaDataFilePath);
  return JSON.parse(data);
}

// Fungsi untuk menulis data verifikasi ke file
function writeCaptchaData(data) {
  fs.writeFileSync(captchaDataFilePath, JSON.stringify(data, null, 2));
}

module.exports.verifyUser = async (client, message) => {
  const settings = await getGuildSettings(message.guild.id);
  if (!settings) {
    return message.reply('⚠️ Bot belum dikonfigurasi untuk server ini.');
  }

  const userId = message.author.id;
  const member = message.member;
  const guild = message.guild;
  const verifiedRole = guild.roles.cache.find(r => r.name === settings.verified_role_name);

  let captchaStore = readCaptchaData();

  const verifyChannelId = settings.verify_channel_id;
  const verifyChannel = guild.channels.cache.get(verifyChannelId);

  if (!verifyChannel) {
    const reply = await message.reply('⚠️ Channel verifikasi tidak ditemukan. Silakan periksa pengaturan bot.');
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    await message.delete();
    return;
  }

  if (!verifiedRole) {
    const reply = await message.reply('⚠️ Role verifikasi tidak ditemukan. Silakan ganti verifikasi role anda menggunakan **/setup role.**');
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    await message.delete();
    return;
  }

  if (member.roles.cache.has(verifiedRole.id)) {
    const reply = await message.reply('✅ Kamu sudah terverifikasi.');
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    await message.delete();
    return;
  }

  if (!captchaStore[userId]) {
    if (message.content.toLowerCase() !== 'verifikasi') {
      await message.delete();
      return;
    }

    const question = generateQuestion();
    captchaStore[userId] = {
      answer: question.answer,
      guildId: guild.id,
    };

    if (replyMessage) {
      try {
        await replyMessage.delete();
      } catch (_) {}
    }

    replyMessage = await message.reply({
      content: `📘 **Peraturan Verifikasi:**\n` +
        `Untuk melanjutkan, jawab pertanyaan matematika ini: **${question.question} = ?**\n` +
        `Jawaban yang benar akan memberi kamu akses ke **${guild.name}**.\n\n` +
        `Jika kamu tidak menjawab dalam waktu 60 detik, proses verifikasi akan dibatalkan.\n` +
        `Jika kamu sudah siap, balas dengan jawaban yang benar!`,
    });

    writeCaptchaData(captchaStore);

    setTimeout(() => {
      delete captchaStore[userId];
      writeCaptchaData(captchaStore);
      if (replyMessage) replyMessage.delete().catch(() => {});
    }, 60000);

    await message.delete().catch(() => {});
    return;
  }

  if (captchaStore[userId] && message.content.trim() === captchaStore[userId].answer) {
    await member.roles.add(verifiedRole);
    delete captchaStore[userId];
    writeCaptchaData(captchaStore);

    if (replyMessage) {
      try {
        await replyMessage.delete();
      } catch (_) {}
    }

    replyMessage = await message.reply('🎉 Kamu berhasil diverifikasi!');
    setTimeout(() => {
      if (replyMessage) replyMessage.delete().catch(() => {});
    }, 5000);
    return message.delete().catch(() => {});
  } else if (captchaStore[userId]) {
    const newQuestion = generateQuestion();
    captchaStore[userId] = {
      answer: newQuestion.answer,
      guildId: guild.id,
    };

    if (replyMessage) {
      try {
        await replyMessage.delete();
      } catch (_) {}
    }

    replyMessage = await message.reply({
      content: `❌ Jawaban salah. Coba lagi! Pertanyaan baru: **${newQuestion.question} = ?**\n\nJika kamu tidak menjawab dalam waktu 60 detik, proses verifikasi akan dibatalkan.`,
    });

    writeCaptchaData(captchaStore);

    setTimeout(() => {
      delete captchaStore[userId];
      writeCaptchaData(captchaStore);
      if (replyMessage) replyMessage.delete().catch(() => {});
    }, 60000);

    return message.delete().catch(() => {});
  }
};

function generateQuestion() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `${a} + ${b}`,
    answer: (a + b).toString(),
  };
}
