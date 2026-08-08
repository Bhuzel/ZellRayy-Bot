export default {
  command: ['tesbutton-cta', 'tesbuttoncta', 'tescta', 'tesbuttonurl', 'tesbuttoncopy', 'tesbuttoncall'],

  description: 'Demo Tombol CTA (URL Website, Copy Code, & Telepon)',

  async run({ m, config }) {
    await m.sendButton(
      '🔗 *DEMO CALL TO ACTION (CTA) BUTTONS*\n\nPilih jenis tombol CTA berikut:',
      [
        { text: '🌐 Buka Web Github', url: 'https://github.com/vandebry10-star/wesker-bot' },
        { text: '📄 Copy Kode Promo', copyCode: 'ZELLRAYY-2026-BONUS' },
        { text: '📞 Hubungi CS Bot', phoneNumber: '6281234567890' }
      ],
      `${config.botName} • CTA Suite`
    )
  }
}
