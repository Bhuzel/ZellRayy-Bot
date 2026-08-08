export default {
  name: 'Delete Foto Profile Bot',
  command: ['delppbot', 'removeppbot', 'delpp', 'removepp'],
  category: 'owner',
  description: 'Hapus foto profil akun WhatsApp bot',
  settings: { owner: true },

  async run({ m, react, sock }) {
    await react('loading')
    try {
      const botJid = (sock.user?.id || sock.user?.lid || '').split(':')[0] + '@s.whatsapp.net'
      await sock.removeProfilePicture(botJid)
      await react('ok')
      await m.reply('✅ Foto profil bot berhasil dihapus!')
    } catch (e) {
      await react('error')
      await m.reply(`❌ Gagal menghapus foto profil bot: ${e.message}`)
    }
  }
}
