export default {
  name: 'Link Group',
  command: ['linkgroup', 'linkgc'],
  category: 'group',
  description: 'Mendapatkan link undangan grup WhatsApp',
  settings: { botAdmin: true },
  async run({ m, sock }) {
    try {
      const code = await sock.groupInviteCode(m.chat)
      await m.reply(`https://chat.whatsapp.com/${code}`)
    } catch {
      await m.reply('[Link Group] Gagal mengambil link grup. Pastikan bot adalah admin grup.')
    }
  }
}
