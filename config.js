export default {
  // ── Identitas Bot ──────────────────────────────────────────────────────────
  botName: 'ZellRayy-Bot', // ganti juga gapapa bole kokk :)
  sessionName: 'session',

  // ── Login Mode ─────────────────────────────────────────────────────────────
  pairingMode: true,

  // ── Prefix & Mode ──────────────────────────────────────────────────────────
  prefix: ['.', '/', '!', '#'],
  usePrefix: true,

  // ── Owner & Premium ────────────────────────────────────────────────────────
  ownerNumber: [
    '6282352052566'
  ],
  premiumNumber: [],

  // ── Tampilan Menu ──────────────────────────────────────────────────────────
  // 'interactive' = Tampilan menu dengan thumbnail card & header link
  // 'text'        = Tampilan menu teks murni (basic / tanpa gambar)
  menuStyle: 'interactive',
  menuThumbnail: 'https://api.zellrayy.com/assets/logo.png',
  menuLink: 'https://api.zellrayy.com',

  // ── WhatsApp Channel / Newsletter Default ─────────────────────────────────
  // Default JID Channel untuk fitur .postch jika JID tidak dispesifikasikan saat kirim
  newsletterJid: '120363xxx@newsletter',

  // ── API ────────────────────────────────────────────────────────────────────
  api: {
    zellrayy: 'https://api.zellrayy.com'
  },

  apiKeys: {
    zellrayy: 'ISI_API_KEY_KAMU_DISINI_____soon'
  },

  // ── Sticker Credit ─────────────────────────────────────────────────────────
  spackname: 'ZellRayy-Bot',
  sauthor: '',

  // ── Pesan Default Bot (Clean & Minimalist) ────────────────────────────────
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