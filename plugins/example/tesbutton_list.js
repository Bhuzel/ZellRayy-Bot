export default {
  command: ['tesbutton-list', 'tesbuttonlist', 'teslist', 'tesdropdown'],
  description: 'Demo Tombol Single Select List (Dropdown Menu)',

  async run({ m, config }) {
    await m.sendButton(
      '📋 *DEMO SINGLE SELECT LIST DROPDOWN*\n\nTekan tombol di bawah untuk membuka daftar pilihan menu:',
      [
        {
          type: 'list',
          text: '📂 Buka Menu Pilihan',
          list: {
            title: 'Daftar Opsi Spesial',
            sections: [
              {
                title: '⚡ Fitur Utama',
                rows: [
                  { title: '🤖 AI Claude Sonnet', description: 'Tanya AI cerdas dengan fitur lengkap', id: '.claude halo' },
                  { title: '⚡ Cek Status Bot', description: 'Lihat kecepatan dan uptime bot', id: '.ping' }
                ]
              },
              {
                title: '👤 Informasi Owner',
                rows: [
                  { title: '📞 Kontak Owner', description: 'Hubungi pengembang bot', id: '.owner' },
                  { title: '🌐 Website Resmi', description: 'Kunjungi situs ZellRayy-Bot', id: '.tesbutton-cta' }
                ]
              }
            ]
          }
        }
      ],
      `${config.botName} • Dropdown List Demo`
    )
  }
}
