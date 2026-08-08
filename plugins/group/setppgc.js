export default {
  name: 'Set Foto Profile Group',
  command: ['setppgc', 'setppgroup', 'setppgrup', 'seticon'],
  category: 'group',
  description: 'Ganti foto profil / ikon grup WhatsApp (Hanya Admin & Bot Admin)',
  settings: { admin: true, botAdmin: true },

  async run({ m, react, sock }) {
    const isImgHere = m.mtype === 'imageMessage' || !!m.msg?.imageMessage
    const isImgQuoted = m.quoted && (m.quoted.mtype === 'imageMessage' || m.quoted.mtype?.includes('image') || !!m.quoted.msg?.imageMessage)

    if (!isImgHere && !isImgQuoted) {
      return m.reply(
        '*[ Set Foto Profil Grup ]*\n\n' +
        'Kirim atau reply *foto* dengan command *.setppgc*\n\n' +
        '📌 *Cara Penggunaan*:\n' +
        '• Kirim foto → caption: `.setppgc`\n' +
        '• Reply foto → `.setppgc`'
      )
    }

    await react('loading')
    try {
      const buffer = isImgQuoted ? await m.quoted.download() : await m.download()
      if (!buffer || buffer.length === 0) throw new Error('Gagal mengunduh foto.')

      await sock.updateProfilePicture(m.chat, buffer)
      await react('ok')
      await m.reply('✅ Foto profil grup berhasil diperbarui!')
    } catch (e) {
      await react('error')
      await m.reply(`❌ Gagal memperbarui foto profil grup: ${e.message}`)
    }
  }
}
