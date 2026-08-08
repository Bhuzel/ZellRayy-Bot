export default {
  command: ['tesbutton-reply', 'tesbuttonreply', 'tesreply'],
  description: 'Demo Tombol Quick Reply (Balas Cepat / Command)',

  async run({ m, config }) {
    await m.sendButton(
      '💬 *DEMO QUICK REPLY BUTTONS*\n\nTombol di bawah akan langsung mengirim perintah/perkataan saat ditekan:',
      [
        { text: '👤 Owner Bot', id: '.owner' },
        { text: '📋 Menu Utama', id: '.menu' },
        { text: '⚡ Cek Ping Speed', id: '.ping' }
      ],
      `${config.botName} • Quick Reply Demo`
    )
  }
}
