# NusaDev Discord Bot

NusaDev adalah bot Discord modular berbasis Node.js yang dirancang untuk komunitas dengan sistem verifikasi pengguna menggunakan pertanyaan matematika. Bot ini dibangun dengan struktur folder yang terorganisir, dukungan command modular, event handler, dan penyimpanan verifikasi berbasis file JSON.

---

## ✨ Fitur Utama

- ✅ Sistem verifikasi pengguna berbasis pertanyaan matematika
- 💬 Command modular dan event terpisah
- 📁 Struktur proyek yang bersih dan mudah dikembangkan
- 🔒 Penghapusan pesan otomatis di channel verifikasi
- 🕒 Batas waktu verifikasi (timeout)

---

## 🧰 Teknologi yang Digunakan

- Node.js
- discord.js v14+
- MySQL (untuk pengaturan guild, opsional)
- JSON (untuk penyimpanan verifikasi sementara)

---

## 📦 Instalasi

1. **Clone repository**

```bash
git clone https://github.com/username/nusadev.git
cd nusadev
```

2. **Install dependencies**
```bash
npm install
```

3. **Konfigurasi bot**
Copy file ```.env.example``` menjadi ```.env``` dan setting file tersebut

4. **Jalankan bot**
```bash
node server.js
```

## 🛡️ Sistem Verifikasi

- Hanya bisa dilakukan di channel yang telah disetup (verify_channel_id).
- User mengetik verifikasi untuk memulai.
- Bot akan mengirimkan pertanyaan matematika, seperti 3 + 4 = ?.
- User harus menjawab langsung dengan angka, tanpa kata tambahan.
- Jawaban salah akan memunculkan pertanyaan baru.
- Jawaban benar akan memberikan role secara otomatis.
- Semua pesan akan dihapus secara otomatis untuk menjaga kebersihan channel.

## 👤 Authors

- [@RulfaDev](https://www.github.com/RulfaDev)

## 🤝 Kontribusi

Kontribusi sangat terbuka!

1. Fork repository ini.
2. Buat branch baru: 
```bash 
git checkout -b fitur-baru
```
3. Commit perubahan:
```bash 
git commit -m 'Tambah fitur verifikasi'
```
4. Push ke branch kamu:
```bash
git push origin fitur-baru.
```
5. Buat Pull Request ke repository utama.