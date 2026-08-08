<div align="center">

<img src="database/image.png" alt="ZellRayy-Bot Banner" width="600"/>

# 🤖 ZellRayy-Bot

**WhatsApp Multi-Device Automation Bot**
*Powered by Node.js, Baileys ES Modules, and ZellRayy API*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Library](https://img.shields.io/badge/Library-Baileys%20MultiDevice-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![API](https://img.shields.io/badge/API-ZellRayy%20API-orange.svg)](https://api.zellrayy.com)
[![GitHub](https://img.shields.io/badge/GitHub-Bhuzel-black.svg)](https://github.com/Bhuzel)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📌 Deskripsi Ringkas

**ZellRayy-Bot** adalah bot WhatsApp modern dan bertenaga tinggi berbasis **Node.js (ES Modules)** dan library `@whiskeysockets/baileys`. Dirancang dengan **Arsitektur 1-Plugin-Per-Berkas**, sistem **Hot-Reload Plugin**, antarmuka **Interactive Native Flow Buttons (Image Header + URL CTA + List Selection Dropdown)**, serta integrasi resmi layanan [ZellRayy API](https://api.zellrayy.com).

Bot ini mendukung fitur lengkap untuk pengelolaan grup, pengunduhan media, pembuatan stiker, pencarian data/lirik, manajemen status WhatsApp, hingga sistem kontrol owner yang aman.

---

## ✨ Fitur & Keunggulan Utama

- 🎨 **Interactive Native Flow Buttons Suite (`.bmenu` & `.ballmenu`)**:
  - Tampilan menu interaktif modern dilengkapi **Image Banner Header**, tombol **URL CTA (Kunjungi Web)**, dan **List Dropdown Selection** interaktif yang dikelompokkan per kategori.
  - Bebas dari tampilan emoji berlebihan, menghasilkan UI yang clean, cepat, dan responsif di seluruh tipe aplikasi WhatsApp (Android, iOS, Web, Desktop).
- ⚡ **Dynamic Prefix & Flexible Mode Engine**:
  - Konfigurasi `usePrefix: false` mendukung penggunaan perintah **dengan prefix** (misal `.ping`) maupun **tanpa prefix** (misal `ping`).
  - Ketika `usePrefix: true`, bot secara ketat hanya merespon perintah ber-prefix.
- 🔒 **Self & Public Mode Switcher (`.mode` / `.public` / `.self`)**:
  - Pengalihan mode pengoperasian bot secara instan tanpa perlu merestart bot. Didukung oleh *whitelist user* pada `database/access-self.json`.
- 🚫 **Ban Chat Group Manager (`.banchat` / `.unbanchat`)**:
  - Memungkinkan owner memblokir bot di grup tertentu agar bot tidak merespon anggota grup tersebut, tanpa mengganggu akses owner di dalam grup. Tersimpan permanen di `database/bannedChats.json`.
- 🛡️ **Realtime Group Admin Fallback Engine**:
  - Penanganan status admin bot secara cerdas dan realtime. Jika bot baru saja dijadikan admin di WhatsApp, bot akan melakukan *auto force-fetch* metadata terbaru dari server WhatsApp tanpa perlu restart.
- 📢 **WhatsApp Channel Integration (`.postch` & `.cekidch`)**:
  - Fitur kirim pesan/media langsung ke WhatsApp Channel (`.postch`) serta inspeksi metadata lengkap saluran (`.cekidch`).
- 👥 **Group Inspector & Profile Picture Manager (`.cekidgc`, `.setppgc`, `.delppgc`)**:
  - Inspeksi detail ID grup (`.cekidgc`) langsung di grup atau via link undangan WhatsApp.
  - Pengubahan dan penghapusan foto profil grup (`.setppgc` & `.delppgc`) khusus admin.
- 🎵 **ZellRayy API Integration**:
  - Integrasi pencarian lirik lagu (`.lirik`), converter media (Audio to MP3, Video to VN, WebP to Image/Video), dan berbagai utilitas canggih.

---

## 📂 Struktur Repositori

```text
Percobaan/
├── config.js               # Pengaturan utama identitas, prefix, owner, & pesan bot
├── index.js                # Main entrypoint, socket listener, & middleware handler
├── package.json            # Manifest proyek & dependensi npm
├── database/               # Penyimpan data lokal & aset gambar
│   ├── image.png           # Banner gambar utama menu / bot header
│   ├── access-self.json    # Data status & whitelist Self Mode
│   ├── ...                 # Data list lainnya
├── lib/                    # Core library & helper utilities
│   ├── serialize.js        # Formatter & serializer pesan Baileys
│   ├── button.js           # Engine pembuat Interactive Native Flow Buttons
│   ├── wrapper.js          # Socket method extensions
│   ├── pluginLoader.js     # Loader & watcher plugin otomatis
│   ├── helper.js           # Helper ekstraksi URL & teks
│   ├── bannedChatDB.js     # Database handler chat/grup terban
│   └── ...                 # DB handler owner, premium, banned, converter, dll
└── plugins/                # Direktori plugin perintah bot
    ├── main/               # Plugin menu utama (.menu, .bmenu, .ballmenu)
    ├── group/              # Plugin pengelola grup (.setppgc, .linkgc, .kick, dll)
    ├── owner/              # Plugin khusus owner (.mode, .banchat, .sw, .postch, dll)
    ├── downloader/         # Plugin pengunduh media (.ytmp3, .ytmp4, .tiktok, dll)
    ├── search/             # Plugin pencarian data (.lirik, .lirikspotify)
    ├── maker/              # Plugin pembuat stiker (.sticker, .wm, .brat, dll)
    ├── tools/              # Plugin utilitas (.cekid, .cekidgc, .cekidch, .tomp3, dll)
    └── info/               # Plugin informasi bot (.ping, .info, .owner, dll)
```

---

## ⚙️ Panduan Konfigurasi (`config.js`)

Seluruh pengaturan utama bot dikelola di file **[`config.js`](file:///d:/Rayhan/Coding/A-Program%20Bot%20Juli%202026/Percobaan/config.js)**:

```javascript
export default {
  // Identitas Bot
  botName: 'ZellRayy-Bot',
  sessionName: 'session',

  // Mode Login ( Pairing Code / QR Code )
  pairingMode: true,

  // Pengaturan Prefix
  prefix: ['.', '/', '!', '#'],
  usePrefix: false, // false = fleksibel (bisa pake prefix & tanpa prefix), true = wajib prefix

  // Daftar Nomor Owner (Gunakan format 628xxx tanpa simbol + atau -)
  ownerNumber: [
    '6282352052566'
  ],
  premiumNumber: [],

  // Tampilan Menu Utama (.menu)
  menuStyle: 'interactive', // 'interactive' (link card preview), 'image', atau 'text'
  menuThumbnail: 'https://api.zellrayy.com/assets/logo.png', // URL gambar thumbnail
  menuLink: 'https://api.zellrayy.com',

  // API Key & Metadata Stiker
  apiKeys: {
    zellrayy: 'ISI_API_KEY_KAMU_DISINI'
  },
  sname: 'ZellRayy-Bot',
  sauthor: 'BhuzelRayhan',

  // Pesan Response Default
  messages: {
    wait: 'Sedang memproses, mohon tunggu...',
    owner: 'Fitur ini khusus untuk owner bot.',
    premium: 'Fitur ini khusus untuk member premium.',
    group: 'Fitur ini hanya dapat digunakan dalam grup.',
    private: 'Fitur ini hanya dapat digunakan di chat pribadi.',
    botAdmin: 'Hanya admin grup yang dapat menggunakan fitur ini.',
    grootbotbup: 'Bot belum menjadi admin dalam grup ini.'
  }
}
```

---

## 🔒 Panduan Pengaturan Mode Bot (Public vs Self Mode)

Bot memiliki 2 opsi mode akses:

1. **Public Mode (Default)**:
   - Seluruh pengguna WhatsApp dapat menggunakan perintah bot yang bertipe publik.
2. **Self Mode (Mode Pribadi)**:
   - Bot hanya akan merespon pesan dari **Owner** dan pengguna yang terdaftar di **whitelist**.

### Cara Mengubah Mode:
- **Melalui WhatsApp (Perintah Owner)**:
  - `.mode` ➡️ Mengecek status mode bot saat ini.
  - `.public` ➡️ Mengubah bot menjadi Mode Public.
  - `.self` ➡️ Mengubah bot menjadi Mode Self.
- **Melalui Berkas database**:
  - Buka file `database/access-self.json`:
    ```json
    {
      "active": false,
      "whitelist": []
    }
    ```
    - Set `"active": true` sejak awal untuk mengaktifkan default Self Mode.
    - Tambahkan nomor pengguna ke array `"whitelist"` jika ingin memberi akses khusus saat Self Mode.

---

## 🚀 Panduan Instalasi & Menjalankan Bot

### 1. Persyaratan Sistem
- **Node.js**: Versi 18.0.0 atau yang lebih baru.
- **FFmpeg**: Terinstall pada OS (untuk kebutuhan fitur konversi media & stiker animasi).

### 2. Langkah Instalasi
```bash
# 1. Clone repositori ini ke komputer / server kamu
git clone https://github.com/Bhuzel/ZellRayy-Bot.git
cd ZellRayy-Bot

# 2. Install seluruh dependensi npm
npm install

# 3. Jalankan bot
npm start
```

### 3. Tautan Akun via Kode Pairing (8-Digit Pairing Code)
1. Pastikan `pairingMode: true` pada `config.js`.
2. Saat perintah `npm start` dijalankan di terminal, bot akan meminta nomor telepon WhatsApp kamu (contoh: `6282352052566`).
3. Masukkan nomor telepon lalu tekan **Enter**.
4. Salin **Kode Pairing 8 Digit** (misal: `ZELL-1234`) yang muncul di terminal.
5. Buka aplikasi WhatsApp di Smartphone ➡️ **Perangkat Tertaut (Linked Devices)** ➡️ **Tautkan dengan Nomor Telepon**, lalu masukkan kode tersebut.
6. Setelah sukses terhubung, kredensial sesi akan otomatis tersimpan di folder `session/`.

---

## 🌐 Tautan & Kontak Resmi

- **Developer GitHub**: [https://github.com/Bhuzel](https://github.com/Bhuzel)
- **Repositori Proyek**: [https://github.com/Bhuzel/ZellRayy-Bot](https://github.com/Bhuzel/ZellRayy-Bot)
- **Layanan API**: [https://api.zellrayy.com](https://api.zellrayy.com)

---

<div align="center">

Distributed under the **MIT License**. Created and maintained with ❤️ by **[ZellRayy (Bhuzel)](https://github.com/Bhuzel)**.

</div>
