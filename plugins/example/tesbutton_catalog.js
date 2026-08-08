export default {
  command: ['tesbutton-catalog', 'tesbuttoncatalog', 'tescatalog'],
  description: 'Demo Tombol Catalog & View Catalog Store',

  async run({ m, config }) {
    await m.sendButton(
      '🛍️ *DEMO CATALOG BUTTONS*\n\nPilih tombol di bawah untuk melihat katalog toko WhatsApp:',
      [
        { text: '🛒 Buka Katalog Toko', url: 'https://wa.me/c/6281234567890' },
        { text: '📦 Lihat Daftar Produk', id: '.tesbutton-list' }
      ],
      `${config.botName} • Business Store`
    )
  }
}
