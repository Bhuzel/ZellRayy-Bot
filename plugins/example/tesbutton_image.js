export default {
  command: ['tesbutton-image', 'tesbuttonimage', 'tesimagebutton', 'tesbuttonmedia'],

  description: 'Demo Tombol Dengan Header Gambar / Banner Media',

  async run({ m, sock, config }) {
    await sock.sendButtons(m.chat, {
      image: { url: 'https://picsum.photos/800/400' },
      caption: '🖼️ *DEMO MEDIA HEADER BUTTONS*\n\nPesan ini menyertakan gambar banner di bagian atas beserta tombol interaktif:',
      footer: `${config.botName} • Media Header Suite`,
      buttons: [
        { text: '📋 Lihat Menu', id: '.menu' },
        { text: '🌐 Kunjungi Web', url: 'https://google.com' },
        { text: '📄 Copy Voucher', copyCode: 'DISDISKON50' }
      ]
    }, { quoted: m })
  }
}
