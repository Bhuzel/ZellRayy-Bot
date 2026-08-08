export default {
  name: 'Revoke Link',
  command: ['revoke', 'resetlink'],
  category: 'group',
  description: 'Mereset link undangan grup WhatsApp',
  settings: { admin: true, botAdmin: true },
  async run({ m, sock }) {
    try {
      await sock.groupRevokeInvite(m.chat)
      const newCode = await sock.groupInviteCode(m.chat)
      await m.reply(`[Revoke Link] Link grup berhasil diperbarui:\nhttps://chat.whatsapp.com/${newCode}`)
    } catch {
      await m.reply('[Revoke Link] Gagal memperbarui link grup. Pastikan bot adalah admin grup.')
    }
  }
}
