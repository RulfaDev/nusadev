
module.exports.verifyUser = async (client, message) => {
  const userId = message.author.id;
  const member = message.member;
  const guild = message.guild;
  const verifiedRole = guild.roles.cache.find(r => r.name === client.config.verifiedRoleName);
  const captchaStore = {};

  // Cek apakah sudah diverifikasi
  if (member.roles.cache.has(verifiedRole.id)) {
    const reply = await message.reply('✅ Kamu sudah terverifikasi.');
    setTimeout(() => {
      reply.delete();
    }, 3000);
    await message.delete();

    return;
  }

  if (message.content.toLowerCase() === 'verifikasi') {
    const question = generateQuestion();
    captchaStore[userId] = { answer: question.answer };

    const reply = await message.reply({
      content: `📘 Jawab pertanyaan ini: **${question.question} = ?**`,
    });

    setTimeout(() => {
      delete captchaStore[userId];
    }, 60000);

    return;
  }

  // Verifikasi jawaban
  if (captchaStore[userId] && message.content.trim() === captchaStore[userId].answer) {
    await member.roles.add(verifiedRole);
    delete captchaStore[userId];
    await message.reply('🎉 Kamu berhasil diverifikasi!');
  } else {
    await message.reply('❌ Jawaban salah. Coba lagi.');
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
