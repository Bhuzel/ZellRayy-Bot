export default {
  name: 'Delete Foto Profile Group',
  command: ['delppgc', 'delppgroup', 'removeppgc', 'removeppgroup'],
  category: 'group',
  description: 'Hapus foto profil / ikon grup WhatsApp (Hanya Admin & Bot Admin)',
  settings: { admin: true, botAdmin: true },

  async run({ m, react, sock }) {
    await react('loading')
    try {
      await sock.removeProfilePicture(m.chat)
      await react('ok')
      await m.reply('✅ Foto profil grup berhasil dihapus!')
    } catch (e) {
      await react('error')
      await m.reply(`❌ Gagal menghapus foto profil grup: ${e.message}`)
    }
  }
}
